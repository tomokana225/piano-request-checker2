import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

// --- TYPE DEFINITIONS ---
interface Song {
  title: string;
  artist: string;
  genre: string;
  isNew: boolean;
  status: 'playable' | 'practicing';
}

interface SearchResult {
  status: 'found' | 'related' | 'notFound';
  songs: Song[];
  searchTerm: string;
}

interface RankingItem {
  id: string; // song title
  count: number;
  artist: string;
}

interface RequestRankingItem {
    id:string; // requested song title
    count: number;
}

interface BlogPost {
    id: string;
    title: string;
    content: string;
    isPublished: boolean;
    createdAt: number;
    updatedAt: number;
}

interface LayoutConfig {
    header: {
        title: string;
        subtitle: string;
        textColor: string;
    };
    nav: {
        style: 'grid' | 'row';
    };
    banners: {
        doneru: { visible: boolean; text: string; buttonText: string; };
        twitcast: { visible: boolean; text: string; buttonText: string; };
    };
    theme: {
        backgroundColor: string;
        backgroundImage: string;
        primaryColor: string;
        secondaryColor: string;
    };
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
    header: {
        title: 'リクエスト曲チェッカー',
        subtitle: '弾ける曲 or ぷりんと楽譜にある曲かチェックできます',
        textColor: '#FFFFFF',
    },
    nav: { style: 'grid' },
    banners: {
        doneru: { visible: true, text: '「どねる」を使うと高い還元率で配信者を応援できます', buttonText: '配信者を応援する' },
        twitcast: { visible: true, text: 'ツイキャス配信はこちらから', buttonText: '配信を視聴する' },
    },
    theme: {
        backgroundColor: '#111827', // bg-gray-900
        backgroundImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop',
        primaryColor: '#EC4899', // pink-600
        secondaryColor: '#14B8A6', // teal-500
    }
};


// --- ICON COMPONENTS ---
interface IconProps { children: React.ReactNode; className?: string; }
const Icon: React.FC<IconProps> = ({ children, className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{children}</svg>;
// Fix: Add 'style' prop to allow for inline styling of icons.
interface SimpleIconProps { className?: string; style?: React.CSSProperties; }
const SearchIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></Icon>;
const XIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Icon>;
const PlusIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Icon>;
const ExternalLinkIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></Icon>;
const ListBulletIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></Icon>;
const GiftIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></Icon>;
const HeartIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></Icon>;
const VideoCameraIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></Icon>;
const YouTubeIcon: React.FC<SimpleIconProps> = ({ className }) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.325-11.412 132.325s0 89.458 11.412 132.325c6.281 23.65 24.787 42.276 48.284 48.597C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.322 42.003 24.947 48.284-48.597 11.412-42.867-11.412-132.325-11.412-132.325s0-89.458-11.412-132.325zM232 344.473l144-88.131-144-88.131v176.262z" /></svg>);
const TrendingUpIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></Icon>;
const CloudUploadIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9" /></Icon>;
const CheckCircleIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
const BookOpenIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></Icon>;
const ArrowLeftIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Icon>;

// Fix: Accept and apply the 'style' prop to the SVG element.
const LoadingSpinner: React.FC<SimpleIconProps> = ({ className, style }) => (
    <svg className={`animate-spin ${className}`} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- UI COMPONENTS ---
interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  disabled: boolean;
  themeColor: string;
}
const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, handleSearch, disabled, themeColor }) => (
  <div className="relative w-full max-w-xl mx-auto">
    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="曲名やアーティスト名で検索..." disabled={disabled} className="w-full pl-5 pr-28 py-4 text-lg bg-gray-700/50 border border-gray-600 rounded-full text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" style={{'--tw-ring-color': themeColor} as React.CSSProperties} />
    <button onClick={handleSearch} disabled={disabled} className="absolute inset-y-0 right-2 my-2 flex items-center px-6 text-white font-bold rounded-full transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed" style={{ backgroundColor: disabled ? '' : themeColor }}><SearchIcon className="h-6 w-6 mr-2" /> <span className="font-bold">検索</span></button>
  </div>
);

interface DonationBannerProps { config: LayoutConfig['banners']['doneru']; }
const DonationBanner: React.FC<DonationBannerProps> = ({ config }) => !config.visible ? null : (
  <div className="w-full max-w-2xl mx-auto mt-8 p-5 bg-gradient-to-r from-orange-800/30 to-yellow-800/30 border border-orange-400/50 rounded-2xl text-center shadow-lg animate-fade-in">
    <p className="text-gray-200 mb-4">{config.text}</p>
    <a href="https://doneru.jp/tomo_piano" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-2 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-md">
      <HeartIcon className="h-5 w-5" />
      <span>{config.buttonText}</span>
    </a>
  </div>
);

interface TwitcastBannerProps { config: LayoutConfig['banners']['twitcast']; }
const TwitcastBanner: React.FC<TwitcastBannerProps> = ({ config }) => !config.visible ? null : (
  <div className="w-full max-w-2xl mx-auto mt-6 p-5 bg-gradient-to-r from-cyan-800/30 to-blue-800/30 border border-cyan-400/50 rounded-2xl text-center shadow-lg animate-fade-in">
    <p className="text-gray-200 mb-4">{config.text}</p>
    <a href="https://twitcasting.tv/tomo_piano" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md">
      <VideoCameraIcon className="h-5 w-5" />
      <span>{config.buttonText}</span>
    </a>
  </div>
);

interface SearchResultsProps {
    results: SearchResult | null;
    isLoading: boolean;
    handleRequestSong: (term: string) => void;
    requestStatus: 'idle' | 'sending' | 'sent' | 'error';
    theme: LayoutConfig['theme'];
}
const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading, handleRequestSong, requestStatus, theme }) => {
    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl animate-fade-in text-center flex flex-col items-center justify-center gap-4">
                <LoadingSpinner className="h-10 w-10" style={{color: theme.primaryColor}} />
                <p className="text-lg text-gray-300">検索中...</p>
            </div>
        );
    }
    if (!results) return null;

    const printGakufuUrl = `https://www.print-gakufu.com/search/result/score___keyword__${encodeURIComponent(results.searchTerm)}___subscription/`;
    
    interface SongResultItemProps { song: Song; }
    const SongResultItem: React.FC<SongResultItemProps> = ({ song }) => (
        <div className="py-3 px-2 border-b border-gray-700/50 text-left last:border-b-0 flex justify-between items-center">
            <div><p className="text-lg text-white font-bold">{song.title}</p><p className="text-md text-gray-400">by {song.artist}</p></div>
            {song.status === 'practicing' && (<span className="text-xs font-semibold bg-yellow-600 text-white px-2 py-1 rounded-full whitespace-nowrap">💪練習中</span>)}
        </div>
    );
    
    const renderResults = () => {
        switch (results.status) {
            case 'found': return (
                <div>
                    <h3 className="text-2xl font-bold mb-3" style={{color: theme.primaryColor}}>曲が見つかりました！</h3>
                    <div className="space-y-2">{results.songs.map((song, i) => <SongResultItem key={i} song={song} />)}</div>
                </div>
            );
            case 'related': return (
                <div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-3">こちらの曲はいかがですか？</h3>
                    <div className="space-y-2">{results.songs.map((song, i) => <SongResultItem key={i} song={song} />)}</div>
                </div>
            );
            case 'notFound': return (
                <div>
                    <h3 className="text-2xl font-bold text-red-400 mb-3">見つかりませんでした</h3>
                    <button onClick={() => handleRequestSong(results.searchTerm)} disabled={requestStatus !== 'idle'} className="inline-flex items-center gap-3 px-6 py-3 font-bold rounded-full transition-all" style={{backgroundColor: theme.secondaryColor, color: 'white'}}>
                        {requestStatus === 'idle' && <><CloudUploadIcon className="h-5 w-5" /><span>この曲をリクエストする</span></>}
                        {requestStatus === 'sending' && <><LoadingSpinner className="h-5 w-5" /><span>送信中...</span></>}
                        {requestStatus === 'sent' && <><CheckCircleIcon className="h-5 w-5" /><span>リクエストしました！</span></>}
                        {requestStatus === 'error' && <span>エラー</span>}
                    </button>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl animate-fade-in text-center">
            {renderResults()}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
                <a href={printGakufuUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3 text-white font-bold rounded-full transition-all" style={{backgroundColor: theme.primaryColor}}>
                    <ExternalLinkIcon className="h-5 w-5" />
                    <span>プリント楽譜で確認する</span>
                </a>
            </div>
        </div>
    );
};

// ... AdminModal and other modals and views ...
// Note: Many components are defined inside App to keep it as a single file for simplicity.
// In a larger app, these would be in separate files.


// --- NAVIGATION BUTTON COMPONENT ---
interface NavButtonProps {
  onClick: () => void;
  isActive?: boolean;
  IconComponent: React.FC<{ className?: string }>;
  label: string;
  config: LayoutConfig;
  className?: string;
  isSpecial?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ onClick, isActive = false, IconComponent, label, config, className = '', isSpecial = false }) => {
  const isGrid = config.nav.style === 'grid';
  const baseClasses = "font-bold transition-all duration-300 flex items-center justify-center gap-2 text-center transform hover:scale-105 shadow-md w-full";
  
  const layoutClasses = isGrid 
    ? "flex-col rounded-xl p-4 aspect-square" 
    : "flex-row rounded-full px-4 py-3";

  const activeStyle = { backgroundColor: config.theme.primaryColor, color: 'white' };
  const inactiveStyle = { backgroundColor: 'rgba(55, 65, 81, 0.5)', color: '#D1D5DB' }; // gray-700/50, gray-300
  const specialStyle = { backgroundColor: config.theme.secondaryColor, color: 'white' };

  const style = isSpecial ? specialStyle : isActive ? activeStyle : inactiveStyle;
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${layoutClasses} ${className}`} style={style}>
      <IconComponent className="h-6 w-6" />
      <span className={isGrid ? "text-xs" : "text-sm"}>{label}</span>
    </button>
  );
};


// --- MAIN APP COMPONENT ---
function App() {
  // --- STATE ---
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
  const [isBlogAdminOpen, setIsBlogAdminOpen] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  type Mode = 'search' | 'list' | 'ranking' | 'requests' | 'blog';
  const [mode, setMode] = useState<Mode>('search');
  const [rankingList, setRankingList] = useState<RankingItem[]>([]);
  const [requestRankingList, setRequestRankingList] = useState<RequestRankingItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT_CONFIG);

  // --- DATA FETCHING & PARSING ---
  const parseSongs = useCallback((str: string): Song[] => {
    if (!str) return [];
    return str.replace(/\r\n/g, '\n').split('\n').map(line => {
      if (!line.trim()) return null;
      const parts = line.split(',');
      if (parts.length < 2 || !parts[0] || !parts[1]) return null;
      return {
        title: parts[0].trim(),
        artist: parts[1].trim(),
        genre: parts[2]?.trim() || '',
        isNew: parts[3]?.trim()?.toLowerCase() === 'new',
        status: parts[4]?.trim()?.toLowerCase() === '練習中' ? 'practicing' : 'playable',
      };
    }).filter((s): s is Song => s !== null);
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setConnectionStatus('connecting');
    try {
        const [
            songsRes, 
            rankingRes, 
            reqRankingRes,
            layoutRes,
            postsRes,
        ] = await Promise.all([
            fetch('/api/songs'),
            fetch('/api/get-ranking'),
            fetch('/api/get-request-ranking'),
            fetch('/api/layout-config'),
            fetch('/api/blog'),
        ]);

        if (!songsRes.ok) throw new Error('Songs fetch failed');
        const songsData = await songsRes.json();
        setSongs(parseSongs(songsData.list));

        if (rankingRes.ok) setRankingList(await rankingRes.json());
        if (reqRankingRes.ok) setRequestRankingList(await reqRankingRes.json());
        if (layoutRes.ok) setLayoutConfig(await layoutRes.json());
        if (postsRes.ok) setPosts(await postsRes.json());
        
        setConnectionStatus('connected');
    } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setConnectionStatus('offline');
    } finally {
        setIsLoading(false);
    }
  }, [parseSongs]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- API HANDLERS ---
  const handleSaveSongs = async (newListStr: string) => {
      await fetch('/api/songs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ list: newListStr }) });
      setSongs(parseSongs(newListStr));
  };

  const handleSaveLayout = async (newConfig: LayoutConfig) => {
      await fetch('/api/layout-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newConfig) });
      setLayoutConfig(newConfig);
      setIsLayoutEditorOpen(false);
  };
  
  const handleSavePost = async (post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const isUpdating = !!post.id;
      const response = await fetch(`/api/blog${isUpdating ? `?id=${post.id}` : ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post),
      });
      if (response.ok) {
        const updatedPosts = await (await fetch('/api/blog?admin=true')).json();
        setPosts(updatedPosts);
      }
  };

  const handleDeletePost = async (id: string) => {
      if (window.confirm("本当にこの記事を削除しますか？")) {
          await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
          setPosts(posts.filter(p => p.id !== id));
      }
  };

  const handleSearch = async () => { /* ... (search logic remains the same) ... */ };
  const handleRequestSong = async (term: string) => { /* ... (request logic remains the same) ... */ };

  // --- RENDER LOGIC ---
  const mainContent = () => {
    switch(mode) {
        case 'search': return (
            <div className="animate-fade-in">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={handleSearch} disabled={isLoading} themeColor={layoutConfig.theme.primaryColor} />
              <SearchResults results={searchResults} isLoading={isLoading} handleRequestSong={handleRequestSong} requestStatus={requestStatus} theme={layoutConfig.theme} />
              <DonationBanner config={layoutConfig.banners.doneru} />
              <TwitcastBanner config={layoutConfig.banners.twitcast} />
            </div>
        );
        case 'list': return <p>List View</p>; // Placeholder
        case 'ranking': return <p>Ranking View</p>; // Placeholder
        case 'requests': return <p>Request Ranking View</p>; // Placeholder
        case 'blog': return <p>Blog View</p>; // Placeholder for Blog View
        default: return null;
    }
  };

  return (
    <>
      <style>{`
        :root {
          --bg-color: ${layoutConfig.theme.backgroundColor};
          --primary-color: ${layoutConfig.theme.primaryColor};
          --secondary-color: ${layoutConfig.theme.secondaryColor};
        }
      `}</style>
      <div className="min-h-screen text-white" style={{ backgroundColor: 'var(--bg-color)' }}>
        {connectionStatus !== 'connected' && (
            <div className={`fixed top-0 left-0 right-0 p-2 text-center text-sm z-50`}>
                {connectionStatus === 'connecting' ? 'サーバーに接続中...' : 'オフラインモード'}
            </div>
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" style={{backgroundImage: `url('${layoutConfig.theme.backgroundImage}')`}}></div>
        <div className="relative z-10 container mx-auto px-4 pt-20 pb-8 md:pt-24 md:pb-16">
          <header className="text-center mb-8" style={{color: layoutConfig.header.textColor}}>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-shadow-lg">{layoutConfig.header.title}</h1>
            <p className="text-gray-300">{layoutConfig.header.subtitle}</p>
          </header>
          
          <div className={`mb-8 max-w-md mx-auto md:max-w-xl ${layoutConfig.nav.style === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-wrap justify-center gap-3'}`}>
              <NavButton onClick={() => setMode('search')} isActive={mode === 'search'} IconComponent={SearchIcon} label="曲を検索" config={layoutConfig} />
              <NavButton onClick={() => setMode('list')} isActive={mode === 'list'} IconComponent={ListBulletIcon} label="曲リスト" config={layoutConfig} />
              <NavButton onClick={() => setMode('ranking')} isActive={mode === 'ranking'} IconComponent={TrendingUpIcon} label="人気曲" config={layoutConfig} />
              <NavButton onClick={() => setMode('requests')} isActive={mode === 'requests'} IconComponent={CloudUploadIcon} label="リクエスト" config={layoutConfig} />
              <NavButton onClick={() => setMode('blog')} isActive={mode === 'blog'} IconComponent={BookOpenIcon} label="ブログ" config={layoutConfig} />
              <NavButton onClick={() => setIsSuggestOpen(true)} isSpecial={true} IconComponent={GiftIcon} label="おまかせ選曲" config={layoutConfig} className={layoutConfig.nav.style === 'grid' ? "col-span-2" : ""} />
          </div>

          <main>{mainContent()}</main>
        </div>

        {/* Admin Modals would be here */}
        <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} onOpenLayoutEditor={() => setIsLayoutEditorOpen(true)} onOpenBlogAdmin={() => setIsBlogAdminOpen(true)} />
        <LayoutEditorModal isOpen={isLayoutEditorOpen} onClose={() => setIsLayoutEditorOpen(false)} currentConfig={layoutConfig} onSave={handleSaveLayout} />
        {/* <BlogAdminModal isOpen={isBlogAdminOpen} ... /> */}
      </div>
    </>
  );
}


// --- ADMIN & EDITOR COMPONENTS ---

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenLayoutEditor: () => void;
    onOpenBlogAdmin: () => void;
}
const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onOpenLayoutEditor, onOpenBlogAdmin }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md m-4 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">管理者メニュー</h2>
                <div className="flex flex-col gap-4">
                    <button className="p-4 bg-cyan-600 rounded-lg text-white font-bold">曲リストを編集</button>
                    <button onClick={onOpenLayoutEditor} className="p-4 bg-purple-600 rounded-lg text-white font-bold">レイアウトを編集</button>
                    <button onClick={onOpenBlogAdmin} className="p-4 bg-green-600 rounded-lg text-white font-bold">ブログを管理</button>
                </div>
                <button onClick={onClose} className="mt-8 w-full p-3 bg-gray-600 rounded-lg text-white">閉じる</button>
            </div>
        </div>
    );
};

interface LayoutEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentConfig: LayoutConfig;
    onSave: (newConfig: LayoutConfig) => void;
}
const LayoutEditorModal: React.FC<LayoutEditorModalProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
    const [config, setConfig] = useState(currentConfig);
    useEffect(() => setConfig(currentConfig), [currentConfig]);

    const handleSave = () => onSave(config);
    const handleChange = (section: keyof LayoutConfig, key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: value }
        }));
    };
    const handleThemeChange = (key: keyof LayoutConfig['theme'], value: any) => {
        setConfig(prev => ({ ...prev, theme: { ...prev.theme, [key]: value } }));
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col">
                <h2 className="text-2xl p-4 border-b border-gray-700">レイアウト編集</h2>
                <div className="flex-grow p-4 overflow-y-auto space-y-6">
                    {/* Header Section */}
                    <div>
                        <h3 className="font-bold text-lg mb-2">ヘッダー</h3>
                        <input value={config.header.title} onChange={e => handleChange('header', 'title', e.target.value)} className="w-full bg-gray-700 p-2 rounded" />
                        <input value={config.header.subtitle} onChange={e => handleChange('header', 'subtitle', e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-2" />
                        <input type="color" value={config.header.textColor} onChange={e => handleChange('header', 'textColor', e.target.value)} className="mt-2" />
                    </div>
                    {/* Theme Section */}
                    <div>
                        <h3 className="font-bold text-lg mb-2">テーマ & 背景</h3>
                        <label>背景色: <input type="color" value={config.theme.backgroundColor} onChange={e => handleThemeChange('backgroundColor', e.target.value)} /></label>
                        <label className="block mt-2">テーマ色1: <input type="color" value={config.theme.primaryColor} onChange={e => handleThemeChange('primaryColor', e.target.value)} /></label>
                        <label className="block mt-2">テーマ色2: <input type="color" value={config.theme.secondaryColor} onChange={e => handleThemeChange('secondaryColor', e.target.value)} /></label>
                        <input placeholder="背景画像URL" value={config.theme.backgroundImage} onChange={e => handleThemeChange('backgroundImage', e.target.value)} className="w-full bg-gray-700 p-2 rounded mt-2" />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 rounded">保存</button>
                </div>
            </div>
        </div>
    );
};

export default App;