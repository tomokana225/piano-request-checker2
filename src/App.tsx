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
    id: string; // requested song title
    count: number;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: { _seconds: number, _nanoseconds: number };
}

interface UiConfig {
    mainTitle: string;
    subtitle: string;
    primaryColor: string;
    navButtons: {
        search: { label: string; enabled: boolean };
        list: { label: string; enabled: boolean };
        ranking: { label: string; enabled: boolean };
        requests: { label: string; enabled: boolean };
        blog: { label: string; enabled: boolean };
        suggest: { label: string; enabled: boolean };
    }
}

const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'リクエスト曲チェッカー',
    subtitle: '弾ける曲 or ぷりんと楽譜にある曲かチェックできます',
    primaryColor: '#ec4899', // Default to pink-600
    navButtons: {
        search: { label: '曲を検索', enabled: true },
        list: { label: '曲リスト', enabled: true },
        ranking: { label: '人気曲', enabled: true },
        requests: { label: 'リクエスト', enabled: true },
        blog: { label: 'お知らせ', enabled: true },
        suggest: { label: 'おまかせ選曲', enabled: true },
    }
};

// --- ICON COMPONENTS ---
interface IconProps {
  children: React.ReactNode;
  className?: string;
}
const Icon: React.FC<IconProps> = ({ children, className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{children}</svg>;

interface SimpleIconProps {
  className?: string;
}
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
const NewspaperIcon: React.FC<SimpleIconProps> = ({ className }) => <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6M7 8h6" /></Icon>;

const LoadingSpinner: React.FC<SimpleIconProps> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
}
const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, handleSearch, disabled }) => (
  <div className="relative w-full max-w-xl mx-auto">
    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="曲名やアーティスト名で検索..." disabled={disabled} className="w-full pl-5 pr-28 py-4 text-lg bg-gray-700/50 border border-gray-600 rounded-full text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" />
    <button onClick={handleSearch} disabled={disabled} style={{backgroundColor: 'var(--primary-color)'}} className="absolute inset-y-0 right-2 my-2 flex items-center px-6 text-white font-bold rounded-full hover:opacity-90 transition-opacity duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"><SearchIcon className="h-6 w-6 mr-2" /> <span className="font-bold">検索</span></button>
  </div>
);

const DonationBanner: React.FC = () => (
  <div className="w-full max-w-2xl mx-auto mt-8 p-5 bg-gradient-to-r from-orange-800/30 to-yellow-800/30 border border-orange-400/50 rounded-2xl text-center shadow-lg animate-fade-in">
    <p className="text-gray-200 mb-4">「どねる」を使うと高い還元率で配信者を応援できます</p>
    <a href="https://doneru.jp/tomo_piano" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-2 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 shadow-md">
      <HeartIcon className="h-5 w-5" />
      <span>配信者を応援する</span>
    </a>
  </div>
);

const TwitcastBanner: React.FC = () => (
  <div className="w-full max-w-2xl mx-auto mt-6 p-5 bg-gradient-to-r from-cyan-800/30 to-blue-800/30 border border-cyan-400/50 rounded-2xl text-center shadow-lg animate-fade-in">
    <p className="text-gray-200 mb-4">ツイキャス配信はこちらから</p>
    <a href="https://twitcasting.tv/tomo_piano" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-md">
      <VideoCameraIcon className="h-5 w-5" />
      <span>配信を視聴する</span>
    </a>
  </div>
);

interface SearchResultsProps {
    results: SearchResult | null;
    isLoading: boolean;
    handleRequestSong: (term: string) => void;
    requestStatus: 'idle' | 'sending' | 'sent' | 'error';
}
const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading, handleRequestSong, requestStatus }) => {
    useEffect(() => {
    }, [results?.searchTerm]);
    
    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl animate-fade-in text-center flex flex-col items-center justify-center gap-4">
                <LoadingSpinner className="h-10 w-10 text-cyan-400" />
                <p className="text-lg text-gray-300">検索中...</p>
            </div>
        );
    }
    if (!results) return null;

    const printGakufuUrl = `https://www.print-gakufu.com/search/result/score___keyword__${encodeURIComponent(results.searchTerm)}___subscription/`;

    const ResultHeader = ({ color, title }: { color: string, title: string }) => (
        <h3 className={`text-2xl font-bold ${color} mb-3`}>{title}</h3>
    );
    
    interface SongResultItemProps { song: Song; }
    const SongResultItem: React.FC<SongResultItemProps> = ({ song }) => (
        <div className="py-3 px-2 border-b border-gray-700/50 text-left last:border-b-0 flex justify-between items-center">
            <div>
              <p className="text-lg text-white font-bold">{song.title}</p>
              <p className="text-md text-gray-400">by {song.artist}</p>
            </div>
            {song.status === 'practicing' && (
                <span className="text-xs font-semibold bg-yellow-600 text-white px-2 py-1 rounded-full whitespace-nowrap">💪練習中</span>
            )}
        </div>
    );
    
    const getRequestButtonText = () => {
        switch (requestStatus) {
            case 'sending': return '送信中...';
            case 'sent': return 'リクエストしました！';
            case 'error': return 'エラー';
            default: return 'この曲をリクエストする';
        }
    };
    
    const getRequestButtonIcon = () => {
        switch (requestStatus) {
            case 'sending': return <LoadingSpinner className="h-5 w-5" />;
            case 'sent': return <CheckCircleIcon className="h-5 w-5" />;
            default: return <CloudUploadIcon className="h-5 w-5" />;
        }
    };

    const renderResults = () => {
        switch (results.status) {
            case 'found': {
                const hasPlayable = results.songs.some(s => s.status === 'playable');
                const hasPracticing = results.songs.some(s => s.status === 'practicing');
                
                let title = "曲が見つかりました！";
                let description = "演奏できる曲と練習中の曲が両方含まれています。";

                if (hasPlayable && !hasPracticing) {
                    title = "ピアノ演奏できます！";
                    description = "ぜひリクエストしてくださいね！";
                } else if (!hasPlayable && hasPracticing) {
                    title = "練習中の曲が見つかりました！";
                    description = "完成までもうしばらくお待ちください！";
                }

                return (
                    <div>
                        <ResultHeader color="text-cyan-400" title={title} />
                        <p className="text-gray-200 mb-4">{description}</p>
                        <div className="space-y-2">{results.songs.map((song, i) => <SongResultItem key={i} song={song} />)}</div>
                    </div>
                );
            }
            case 'related':
                return (
                    <div>
                        <ResultHeader color="text-yellow-400" title="こちらの曲はいかがですか？" />
                        <p className="text-gray-300 mb-4">弾ける曲リストにはありませんでしたが、関連する曲が見つかりました。</p>
                        <div className="space-y-2">{results.songs.map((song, i) => <SongResultItem key={i} song={song} />)}</div>
                    </div>
                );
            case 'notFound':
                return (
                    <div>
                        <ResultHeader color="text-red-400" title="見つかりませんでした" />
                        <p className="text-gray-300 mb-4">ゴメンナサイ、この曲はリストにないようです。</p>
                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                            <button 
                                onClick={() => handleRequestSong(results.searchTerm)}
                                disabled={requestStatus === 'sending' || requestStatus === 'sent'}
                                className={`inline-flex items-center gap-3 px-6 py-3 font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-md ${
                                    requestStatus === 'sent' ? 'bg-green-600 text-white cursor-default' : 
                                    requestStatus === 'error' ? 'bg-red-600 text-white' : 
                                    'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-500'
                                }`}
                            >
                                {getRequestButtonIcon()}
                                <span>{getRequestButtonText()}</span>
                            </button>
                             {requestStatus === 'error' && <p className="text-red-400 text-sm mt-2">送信に失敗しました。時間をおいて再試行してください。</p>}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl animate-fade-in text-center">
            {renderResults()}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
                <a href={printGakufuUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3 text-white font-bold rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-md" style={{backgroundColor: 'var(--primary-color)'}}>
                    <ExternalLinkIcon className="h-5 w-5" />
                    <span>プリント楽譜で確認する</span>
                </a>
                <p className="text-gray-400 mt-3 text-sm">アプリで見放題に登録されていれば、初見引きで挑戦できます！</p>
            </div>
        </div>
    );
};

// --- MARKDOWN RENDERER ---
const SimpleMarkdownRenderer: React.FC<{ content: string }> = React.memo(({ content }) => {
    const renderContent = useMemo(() => {
        if (!content) return null;
        const blocks = content.split('\n\n'); 
        return blocks.map((block, index) => {
            const lines = block.split('\n').map(line => 
                line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">$1</a>')
            );
            return <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: lines.join('<br />') }} />;
        });
    }, [content]);

    return <div className="text-left text-gray-300 whitespace-pre-wrap prose prose-invert max-w-none prose-p:text-gray-300 prose-strong:text-white prose-a:text-cyan-400">{renderContent}</div>;
});

// --- BLOG VIEW ---
interface BlogViewProps {
    posts: BlogPost[];
}
const BlogView: React.FC<BlogViewProps> = ({ posts }) => {
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

    const togglePost = (id: string) => {
        setExpandedPostId(prevId => (prevId === id ? null : id));
    };
    
    useEffect(() => {
        if(posts && posts.length > 0) {
            setExpandedPostId(posts[0].id);
        }
    }, [posts]);

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                <h2 className="text-2xl font-bold text-white text-center p-4 bg-gray-900/30">お知らせ</h2>
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <div key={post.id} className="border-b border-gray-700/50 last:border-b-0">
                                <button onClick={() => togglePost(post.id)} className="w-full text-left p-4 hover:bg-gray-700/30 transition-colors duration-200 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{post.title}</h3>
                                        <p className="text-sm text-gray-400">{new Date(post.createdAt._seconds * 1000).toLocaleDateString('ja-JP')}</p>
                                    </div>
                                    <span className={`transform transition-transform ${expandedPostId === post.id ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                {expandedPostId === post.id && (
                                    <div className="p-4 bg-gray-900/20">
                                        <SimpleMarkdownRenderer content={post.content} />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-gray-400">お知らせはまだありません。</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- ADMIN COMPONENTS ---
interface SongListEditorProps {
    songs: Song[];
    onSave: (newList: string) => Promise<void>;
}
const SongListEditor: React.FC<SongListEditorProps> = ({ songs, onSave }) => {
  const [editableSongs, setEditableSongs] = useState<Song[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    setEditableSongs(JSON.parse(JSON.stringify(songs)));
    setError('');
    setSuccessMessage('');
  }, [songs]);

   const handleBulkAdd = () => {
      if (!bulkText.trim()) return;
      const lines = bulkText.trim().replace(/\r\n/g, '\n').split('\n');
      const newSongs = lines.map(line => {
          if (!line.trim()) return null;
          const parts = line.includes('\t') ? line.split('\t') : line.split(','); 
          if (parts.length < 2 || !parts[0]?.trim() || !parts[1]?.trim()) return null;
          const remainingParts = parts.slice(2).map(p => p.trim().toLowerCase());
          return {
              title: parts[0].trim(),
              artist: parts[1].trim(),
              genre: parts[2]?.trim() || '',
              isNew: remainingParts.includes('new'),
              status: remainingParts.includes('練習中') ? 'practicing' : 'playable',
          } as Song;
      }).filter((s): s is Song => s !== null);
      if (newSongs.length > 0) {
          setEditableSongs(prevSongs => [...prevSongs, ...newSongs]);
          setBulkText('');
      }
  };

  const handleInputChange = (index: number, field: keyof Song, value: string | boolean) => {
    const newSongs = [...editableSongs];
    (newSongs[index] as any)[field] = value;
    setEditableSongs(newSongs);
  };
  
  const toggleStatus = (index: number, field: 'isNew' | 'status') => {
    const newSongs = [...editableSongs];
    if (field === 'isNew') newSongs[index].isNew = !newSongs[index].isNew;
    else if (field === 'status') newSongs[index].status = newSongs[index].status === 'practicing' ? 'playable' : 'practicing';
    setEditableSongs(newSongs);
  };

  const handleAddSong = () => setEditableSongs([...editableSongs, { title: '', artist: '', genre: '', isNew: false, status: 'playable' }]);
  const handleRemoveSong = (index: number) => setEditableSongs(editableSongs.filter((_, i) => i !== index));

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const newListStr = editableSongs
        .filter(s => s.title.trim() && s.artist.trim())
        .map(s => [s.title.trim(), s.artist.trim(), s.genre.trim() || '', s.isNew ? 'new' : '', s.status === 'practicing' ? '練習中' : ''].join(','))
        .join('\n');
      await onSave(newListStr);
      setSuccessMessage('✓ サーバーに保存しました！');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('保存に失敗しました。');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
        <div className="overflow-y-auto custom-scrollbar flex-grow p-4">
            <div className="p-4 border-b border-gray-700 mb-4">
                <h3 className="text-xl font-bold text-white mb-2">一括追加</h3>
                <p className="text-sm text-gray-400 mb-2">Excelなどからコピーしたリスト(タブ区切り or CSV)を貼り付け</p>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} className="w-full h-24 bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder={"例:\n夜に駆ける\tYOASOBI\tJ-Pop,new\n千本桜\t黒うさP\tVocaloid,,練習中"} />
                <button onClick={handleBulkAdd} className="mt-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-700 transition-colors">リストに追加</button>
            </div>
            <div className="grid grid-cols-[3fr,2fr,1.5fr,auto,auto] gap-2 items-center text-gray-400 font-bold mb-2 px-4">
                <span>曲名</span><span>アーティスト</span><span>ジャンル</span><span className="text-center">状態</span><span></span>
            </div>
            {editableSongs.map((song, index) => (
                <div key={index} className="grid grid-cols-[3fr,2fr,1.5fr,auto,auto] gap-2 items-center p-2 rounded-lg hover:bg-gray-700/50 mb-1">
                    <input type="text" value={song.title} onChange={e => handleInputChange(index, 'title', e.target.value)} className="bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"/>
                    <input type="text" value={song.artist} onChange={e => handleInputChange(index, 'artist', e.target.value)} className="bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"/>
                    <input type="text" value={song.genre} onChange={e => handleInputChange(index, 'genre', e.target.value)} className="bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"/>
                    <div className="flex gap-1 justify-center">
                        <button onClick={() => toggleStatus(index, 'isNew')} className={`px-2 py-1 text-xs font-bold rounded ${song.isNew ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'}`}>NEW</button>
                        <button onClick={() => toggleStatus(index, 'status')} className={`px-2 py-1 text-xs font-bold rounded ${song.status === 'practicing' ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-300'}`}>練習中</button>
                    </div>
                    <button onClick={() => handleRemoveSong(index)} className="text-gray-400 hover:text-red-500"><XIcon className="w-6 h-6"/></button>
                </div>
            ))}
            <div className="mt-4 px-2">
                <button onClick={handleAddSong} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-cyan-400 font-bold rounded-full hover:bg-gray-600 transition-colors"><PlusIcon className="w-5 h-5" />新しい曲を追加</button>
            </div>
        </div>
        <div className="p-5 bg-gray-800/50 flex justify-end items-center gap-4 flex-shrink-0">
          <div className="mr-auto">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {successMessage && <p className="text-green-400 text-sm">{successMessage}</p>}
          </div>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-700 transition-colors disabled:bg-gray-500 disabled:cursor-wait">{isSaving ? '保存中...' : '変更を保存'}</button>
        </div>
    </div>
  );
};

interface BlogEditorProps {
    posts: BlogPost[];
    onSave: (post: Omit<BlogPost, 'createdAt'>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}
const BlogEditor: React.FC<BlogEditorProps> = ({ posts, onSave, onDelete }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Omit<BlogPost, 'createdAt'> | null>(null);

    const handleSelectPost = (post: BlogPost) => setSelectedPost({...post});
    const handleNewPost = () => setSelectedPost({ id: '', title: '', content: '', isPublished: false });
    const handleUpdateField = (field: keyof Omit<BlogPost, 'createdAt'>, value: string | boolean) => {
        if (selectedPost) setSelectedPost({ ...selectedPost, [field]: value });
    };

    const handleSave = async () => {
        if (!selectedPost || !selectedPost.title) return;
        setIsSaving(true);
        try {
            await onSave(selectedPost);
            setSelectedPost(null);
        } catch (e) { console.error(e); }
        finally { setIsSaving(false); }
    };
    
    const handleDelete = async () => {
        if (selectedPost && selectedPost.id && window.confirm(`「${selectedPost.title}」を削除しますか？`)) {
            setIsSaving(true);
            try {
                await onDelete(selectedPost.id);
                setSelectedPost(null);
            } catch (e) { console.error(e); }
            finally { setIsSaving(false); }
        }
    };
    
    const sortedPosts = useMemo(() => [...posts].sort((a,b) => b.createdAt._seconds - a.createdAt._seconds), [posts]);

    return (
        <div className="flex h-full">
            <div className="w-1/3 border-r border-gray-700 flex flex-col">
                <div className="p-2 border-b border-gray-700"><button onClick={handleNewPost} className="w-full px-4 py-2 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-700 transition-colors">＋ 新規作成</button></div>
                <ul className="overflow-y-auto custom-scrollbar flex-grow">
                    {sortedPosts.map(p => (
                        <li key={p.id} onClick={() => handleSelectPost(p)} className={`p-3 cursor-pointer border-b border-gray-700/50 hover:bg-gray-700/50 ${selectedPost?.id === p.id ? 'bg-gray-700' : ''}`}>
                            <p className="font-bold text-white truncate">{p.title}</p>
                            <p className="text-sm text-gray-400">{p.isPublished ? '公開中' : '下書き'}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="w-2/3 p-4 flex flex-col">
                {selectedPost ? (
                    <>
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-1">タイトル</label>
                            <input type="text" value={selectedPost.title} onChange={e => handleUpdateField('title', e.target.value)} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div className="mb-4 flex-grow flex flex-col">
                            <label className="block text-gray-400 mb-1">内容 (Markdown対応)</label>
                            <textarea value={selectedPost.content} onChange={e => handleUpdateField('content', e.target.value)} className="w-full h-full flex-grow bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 custom-scrollbar" />
                        </div>
                        <div className="flex items-center mb-4"><input type="checkbox" id="isPublished" checked={selectedPost.isPublished} onChange={e => handleUpdateField('isPublished', e.target.checked)} className="mr-2 h-4 w-4" /><label htmlFor="isPublished" className="text-white">公開する</label></div>
                        <div className="flex justify-between">
                            <button onClick={handleDelete} disabled={isSaving || !selectedPost.id} className="px-4 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 disabled:bg-gray-500">削除</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-700 disabled:bg-gray-500">{isSaving ? '保存中...' : '保存'}</button>
                        </div>
                    </>
                ) : <div className="flex items-center justify-center h-full text-gray-500">記事を選択するか、新規作成してください</div>}
            </div>
        </div>
    );
};

interface SettingsEditorProps {
    config: UiConfig;
    onSave: (newConfig: UiConfig) => Promise<void>;
}
const SettingsEditor: React.FC<SettingsEditorProps> = ({ config, onSave }) => {
    const [editableConfig, setEditableConfig] = useState<UiConfig>(config);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => setEditableConfig(config), [config]);

    const handleSave = async () => {
        setIsSaving(true);
        try { await onSave(editableConfig); } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditableConfig(prev => ({...prev, [name]: value}));
    };
    
    const handleNavChange = (key: keyof UiConfig['navButtons'], field: 'label' | 'enabled', value: string | boolean) => {
        setEditableConfig(prev => ({ ...prev, navButtons: { ...prev.navButtons, [key]: { ...prev.navButtons[key], [field]: value }}}));
    };

    return (
        <div className="p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-4">基本設定</h3>
            <div className="space-y-4 mb-6">
                <div><label className="block text-gray-400 mb-1">メインタイトル</label><input type="text" name="mainTitle" value={editableConfig.mainTitle} onChange={handleTextChange} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                <div><label className="block text-gray-400 mb-1">サブタイトル</label><input type="text" name="subtitle" value={editableConfig.subtitle} onChange={handleTextChange} className="w-full bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                <div><label className="block text-gray-400 mb-1">テーマカラー</label><input type="color" name="primaryColor" value={editableConfig.primaryColor} onChange={handleTextChange} className="w-20 h-10 p-1 bg-gray-900 border border-gray-600 rounded cursor-pointer" /></div>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">ナビゲーションボタン設定</h3>
            <div className="space-y-3">
                {Object.entries(editableConfig.navButtons).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4 p-2 bg-gray-900/50 rounded">
                        <input type="checkbox" checked={value.enabled} onChange={e => handleNavChange(key as keyof UiConfig['navButtons'], 'enabled', e.target.checked)} className="h-5 w-5"/>
                        <input type="text" value={value.label} onChange={e => handleNavChange(key as keyof UiConfig['navButtons'], 'label', e.target.value)} className="flex-grow bg-gray-900 text-white p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                ))}
            </div>

            <div className="mt-8 text-right">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-700 disabled:bg-gray-500">{isSaving ? '保存中...' : '設定を保存'}</button>
            </div>
        </div>
    );
};

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    posts: BlogPost[];
    uiConfig: UiConfig;
    onSaveSongs: (newList: string) => Promise<void>;
    onSavePost: (post: Omit<BlogPost, 'createdAt'>) => Promise<void>;
    onDeletePost: (id: string) => Promise<void>;
    onSaveUiConfig: (config: UiConfig) => Promise<void>;
}
const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, songs, posts, uiConfig, onSaveSongs, onSavePost, onDeletePost, onSaveUiConfig }) => {
  type AdminTab = 'songs' | 'blog' | 'settings';
  const [activeTab, setActiveTab] = useState<AdminTab>('songs');
  
  const getTabClass = (tab: AdminTab) => `px-4 py-2 font-bold transition-colors ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] m-4 border border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-4">
             <h2 className="text-2xl font-bold text-white">管理パネル</h2>
             <div className="bg-gray-900 rounded-full p-1 flex">
                <button onClick={() => setActiveTab('songs')} className={getTabClass('songs') + " rounded-l-full"}>曲リスト</button>
                <button onClick={() => setActiveTab('blog')} className={getTabClass('blog')}>ブログ</button>
                <button onClick={() => setActiveTab('settings')} className={getTabClass('settings') + " rounded-r-full"}>アプリ設定</button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><XIcon className="h-8 w-8" /></button>
        </div>
        <div className="flex-grow overflow-hidden">
            {activeTab === 'songs' && <SongListEditor songs={songs} onSave={onSaveSongs} />}
            {activeTab === 'blog' && <BlogEditor posts={posts} onSave={onSavePost} onDelete={onDeletePost} />}
            {activeTab === 'settings' && <SettingsEditor config={uiConfig} onSave={onSaveUiConfig} />}
        </div>
      </div>
    </div>
  );
};


interface SuggestSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    onSelect: (text: string) => void;
}
const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ isOpen, onClose, songs, onSelect }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [resultSong, setResultSong] = useState<Song | null>(null);
    const [displayedSong, setDisplayedSong] = useState<Song | null>(null);
    const spinIntervalRef = useRef<number | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const playableSongs = useMemo(() => songs.filter(s => s.status !== 'practicing'), [songs]);

    const startSpin = () => {
        if (playableSongs.length === 0) {
            setResultSong({ title: "曲がありません", artist: "リストを更新してください", genre: '', isNew: false, status: 'playable' });
            return;
        }
        
        setIsSpinning(true);
        setResultSong(null);
        
        const spinDuration = 3000;
        const intervalTime = 100;

        spinIntervalRef.current = window.setInterval(() => {
            const randomIndex = Math.floor(Math.random() * playableSongs.length);
            setDisplayedSong(playableSongs[randomIndex]);
        }, intervalTime);

        timeoutRef.current = window.setTimeout(() => {
            if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
            const finalIndex = Math.floor(Math.random() * playableSongs.length);
            const finalSong = playableSongs[finalIndex];
            setResultSong(finalSong);
            setDisplayedSong(finalSong);
            setIsSpinning(false);
        }, spinDuration);
    };

    const handleClose = () => {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsSpinning(false);
        setResultSong(null);
        setDisplayedSong(null);
        onClose();
    };
    
    const handleSelectAndClose = () => {
        if(resultSong && resultSong.title !== "曲がありません") {
            onSelect(`「${resultSong.title} / ${resultSong.artist}」をリクエストします！`);
        }
        handleClose();
    };

    useEffect(() => {
      return () => {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={handleClose}>
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md m-4 border border-gray-700 text-center p-8" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">おまかせ選曲</h2>
                <div className="h-32 flex items-center justify-center bg-gray-900 rounded-lg mb-6 p-4 overflow-hidden">
                  {displayedSong ? (
                    <div className="text-center animate-fade-in">
                      <p className={`text-2xl font-bold ${isSpinning ? 'text-gray-400' : 'text-cyan-400'} transition-colors`}>{displayedSong.title}</p>
                      <p className={`text-lg ${isSpinning ? 'text-gray-500' : 'text-gray-300'} transition-colors`}>{displayedSong.artist}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">ボタンを押してスタート！</p>
                  )}
                </div>
                
                {!resultSong ? (
                    <button onClick={startSpin} disabled={isSpinning} style={{backgroundColor: 'var(--primary-color)'}} className="w-full px-6 py-3 text-white font-bold rounded-full hover:opacity-90 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed text-lg">
                        {isSpinning ? '選曲中...' : 'スロットを回す！'}
                    </button>
                ) : (
                   <div className="animate-fade-in flex flex-col gap-4">
                        <button onClick={handleSelectAndClose} className="w-full px-6 py-3 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-700 transition-colors text-lg">
                          この曲をリクエスト！
                        </button>
                        <button onClick={startSpin} disabled={isSpinning} className="w-full px-6 py-2 bg-gray-600 text-white font-bold rounded-full hover:bg-gray-700 transition-colors disabled:bg-gray-500">
                            もう一回！
                        </button>
                    </div>
                )}
                <button onClick={handleClose} className="mt-6 text-gray-400 hover:text-white transition-colors">閉じる</button>
            </div>
        </div>
    );
};

interface ListViewProps {
    songs: Song[];
    rankings: Record<string, number>;
}
const ListView: React.FC<ListViewProps> = ({ songs, rankings }) => {
    type SortMode = 'default' | 'title' | 'popularity' | 'artist' | 'genre';
    const [sortMode, setSortMode] = useState<SortMode>('default');
    const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

    const sortedSongs = useMemo(() => {
        const songsCopy = [...songs];
        if (sortMode === 'title') {
            return songsCopy.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
        }
        if (sortMode === 'popularity') {
            return songsCopy.sort((a, b) => {
                const countA = rankings[a.title] || 0;
                const countB = rankings[b.title] || 0;
                return countB - countA;
            });
        }
        return songs;
    }, [songs, sortMode, rankings]);

    const artistsData = useMemo(() => {
        if (sortMode !== 'artist') return { sortedArtists: [], counts: {} };
        const counts = songs.reduce((acc, song) => {
            acc[song.artist] = (acc[song.artist] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const sortedArtists = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'ja'));
        return { sortedArtists, counts };
    }, [songs, sortMode]);

    const genresData = useMemo(() => {
        if (sortMode !== 'genre') return { sortedGenres: [], counts: {} };
        const counts = songs.reduce((acc, song) => {
            if (song.genre) {
               acc[song.genre] = (acc[song.genre] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const sortedGenres = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'ja'));
        return { sortedGenres, counts };
    }, [songs, sortMode]);

    const handleSortChange = (mode: SortMode) => {
        setSortMode(mode);
        setSelectedArtist(null);
        setSelectedGenre(null);
    };
    
    interface SongListItemProps {
        song: Song;
        displayFormat: 'title-artist' | 'title-only';
    }
    const SongListItem: React.FC<SongListItemProps> = ({ song, displayFormat }) => {
        const searchCount = sortMode === 'popularity' ? rankings[song.title] || 0 : 0;
        return (
            <li className="flex justify-between items-center p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200 last:border-b-0">
                <div className="flex-1 overflow-hidden">
                    <span className="font-bold text-lg text-white truncate block">
                        {displayFormat === 'title-artist' ? `${song.title} - ${song.artist}` : song.title}
                    </span>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  {searchCount > 0 && <span className="text-sm font-mono text-yellow-400">{searchCount}</span>}
                  {song.status === 'practicing' && (
                    <span className="text-xs font-semibold bg-yellow-600 text-white px-2 py-1 rounded-full whitespace-nowrap">💪練習中</span>
                  )}
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.title} ${song.artist}`)}`} target="_blank" rel="noopener noreferrer" title="YouTubeで検索" className="text-gray-400 hover:text-red-500 transition-colors">
                    <YouTubeIcon className="h-6 w-6" />
                  </a>
                </div>
            </li>
        );
    };

    const renderContent = () => {
        if (sortMode === 'artist') {
            if (!selectedArtist) {
                return (<ul>{artistsData.sortedArtists.map(artist => (
                    <li key={artist} onClick={() => setSelectedArtist(artist)} className="flex justify-between items-center p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200 cursor-pointer text-white font-semibold last:border-b-0">
                        <span>{artist}</span>
                        <span className="text-gray-400 text-sm">{artistsData.counts[artist]}曲</span>
                    </li>
                ))}</ul>);
            }
            const artistSongs = songs.filter(s => s.artist === selectedArtist);
            return (<div>
                <button onClick={() => setSelectedArtist(null)} className="p-4 text-cyan-400 hover:text-cyan-300 font-bold w-full text-left border-b border-gray-700/50">← アーティスト一覧に戻る</button>
                 <div className="p-3 text-center text-gray-300 font-semibold bg-gray-900/30">
                    {selectedArtist} (全 {artistSongs.length} 曲)
                </div>
                <ul>{artistSongs.map((song, i) => <SongListItem key={i} song={song} displayFormat="title-only" />)}</ul>
            </div>);
        }

        if (sortMode === 'genre') {
            if (!selectedGenre) {
                return (<ul>{genresData.sortedGenres.map(genre => (
                    <li key={genre} onClick={() => setSelectedGenre(genre)} className="flex justify-between items-center p-4 border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200 cursor-pointer text-white font-semibold last:border-b-0">
                       <span>{genre}</span>
                       <span className="text-gray-400 text-sm">{genresData.counts[genre]}曲</span>
                    </li>
                ))}</ul>);
            }
            const genreSongs = songs.filter(s => s.genre === selectedGenre);
            return (<div>
                <button onClick={() => setSelectedGenre(null)} className="p-4 text-cyan-400 hover:text-cyan-300 font-bold w-full text-left border-b border-gray-700/50">← ジャンル一覧に戻る</button>
                <div className="p-3 text-center text-gray-300 font-semibold bg-gray-900/30">
                    {selectedGenre} (全 {genreSongs.length} 曲)
                </div>
                <ul>{genreSongs.map((song, i) => <SongListItem key={i} song={song} displayFormat="title-artist" />)}</ul>
            </div>);
        }
        
        return (<>
            <div className="p-3 text-center text-gray-400 font-semibold border-b border-gray-700/50">
                {sortMode === 'popularity' ? '検索数ランキング' : `全 ${sortedSongs.length} 曲`}
            </div>
            <ul>{sortedSongs.map((song, i) => <SongListItem key={i} song={song} displayFormat="title-artist" />)}</ul>
        </>);
    };

    const getButtonClass = (mode: SortMode) => `px-4 py-2 text-sm md:text-base rounded-full font-semibold transition-colors ${sortMode === mode ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="flex justify-center flex-wrap gap-2 md:gap-3 mb-4 p-2 bg-gray-900/50 rounded-full">
                <button onClick={() => handleSortChange('default')} className={getButtonClass('default')}>追加順</button>
                <button onClick={() => handleSortChange('title')} className={getButtonClass('title')}>50音順</button>
                <button onClick={() => handleSortChange('popularity')} className={getButtonClass('popularity')}>人気順</button>
                <button onClick={() => handleSortChange('artist')} className={getButtonClass('artist')}>アーティスト別</button>
                <button onClick={() => handleSortChange('genre')} className={getButtonClass('genre')}>ジャンル別</button>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl max-h-[60vh] overflow-y-auto custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    );
};

interface RankingViewProps {
  songs: Song[];
  rankingList: RankingItem[];
}
const RankingView: React.FC<RankingViewProps> = ({ songs, rankingList }) => {
    if (!rankingList || rankingList.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl animate-fade-in text-center">
                <h2 className="text-2xl font-bold text-white mb-4">人気曲ランキング</h2>
                <p className="text-gray-400">まだランキングデータがありません。曲を検索するとデータが記録されます。</p>
            </div>
        );
    }

    const maxCount = rankingList[0]?.count || 1;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                <h2 className="text-2xl font-bold text-white text-center p-4 bg-gray-900/30">人気曲ランキング</h2>
                <ul className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {rankingList.map((item, index) => {
                        const songDetails = songs.find(s => s.title === item.id);
                        const widthPercentage = (item.count / maxCount) * 100;
                        
                        return (
                            <li key={item.id} className="p-4 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors duration-200">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-gray-400 w-8 text-center">{index + 1}</span>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-lg text-white truncate">{item.id}</p>
                                            {songDetails?.status === 'practicing' && (
                                                <span className="text-xs font-semibold bg-yellow-600 text-white px-2 py-1 rounded-full whitespace-nowrap">💪練習中</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 truncate">{item.artist}</p>
                                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                                          <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${widthPercentage}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 ml-4">
                                        <p className="font-mono font-bold text-xl text-yellow-400">{item.count}</p>
                                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.id} ${item.artist}`)}`} target="_blank" rel="noopener noreferrer" title="YouTubeで検索" className="text-gray-400 hover:text-red-500 transition-colors">
                                            <YouTubeIcon className="h-6 w-6" />
                                        </a>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

interface RequestRankingViewProps {
  rankingList: RequestRankingItem[];
}
const RequestRankingView: React.FC<RequestRankingViewProps> = ({ rankingList }) => {
    if (!rankingList || rankingList.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl animate-fade-in text-center">
                <h2 className="text-2xl font-bold text-white mb-4">リクエストランキング</h2>
                <p className="text-gray-400">まだリクエストされた曲はありません。見つからない曲をリクエストすると、ここに表示されます。</p>
            </div>
        );
    }

    const maxCount = rankingList[0]?.count || 1;

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                <h2 className="text-2xl font-bold text-white text-center p-4 bg-gray-900/30">リクエストランキング</h2>
                <ul className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {rankingList.map((item, index) => {
                        const widthPercentage = (item.count / maxCount) * 100;
                        
                        return (
                            <li key={item.id} className="p-4 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-700/30 transition-colors duration-200">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-gray-400 w-8 text-center">{index + 1}</span>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-lg text-white truncate">{item.id}</p>
                                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                                          <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${widthPercentage}%` }}></div>
                                        </div>
                                    </div>
                                     <p className="font-mono font-bold text-xl text-yellow-400 ml-4">{item.count}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};


// --- NAVIGATION BUTTON COMPONENT ---
interface NavButtonProps {
  onClick: () => void;
  isActive?: boolean;
  IconComponent: React.FC<{ className?: string }>;
  label: string;
  className?: string;
  isSpecial?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ onClick, isActive = false, IconComponent, label, className = '', isSpecial = false }) => {
  const baseClasses = "font-bold transition-all duration-300 flex items-center justify-center gap-2 text-center transform hover:scale-105 shadow-md";
  const layoutClasses = "flex-col rounded-xl p-4 md:flex-row md:rounded-full md:px-4 md:py-2";
  
  const activeColor = isSpecial ? '#0d9488' : 'var(--primary-color)'; // teal-600 or dynamic
  const activeStyle = { backgroundColor: activeColor, color: 'white', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.25)' };
  const inactiveStyle = { backgroundColor: 'rgba(55, 65, 81, 0.5)', color: '#D1D5DB' }; // gray-700/50, gray-300
  
  return (
    <button onClick={onClick} style={isActive ? activeStyle : inactiveStyle} className={`${baseClasses} ${layoutClasses} ${className} hover:bg-gray-700`}>
      <IconComponent className="h-6 w-6 md:h-5 md:w-5" />
      <span className="text-xs sm:text-sm md:text-base">{label}</span>
    </button>
  );
};


// --- MAIN APP COMPONENT ---
function App() {
  const FALLBACK_SONGS_STR = `夜に駆ける,YOASOBI,J-Pop,new
Pretender,Official髭男dism,J-Pop
Lemon,米津玄師,J-Pop
紅蓮華,LiSA,Anime
ドライフラワー,優里,J-Pop
白日,King Gnu,J-Rock
マリーゴールド,あいみょん,J-Pop
猫,DISH//,J-Rock
うっせぇわ,Ado,J-Pop
廻廻奇譚,Eve,Anime
炎,LiSA,Anime
Cry Baby,Official髭男dism,Anime
アイドル,YOASOBI,Anime,new
KICK BACK,米津玄師,Anime
新時代,Ado,Anime
旅路,藤井風,J-Pop
何なんw,藤井風,J-Pop
grace,藤井風,J-Pop
きらり,藤井風,J-Pop
Subtitle,Official髭男dism,J-Pop
怪獣の花唄,Vaundy,J-Rock
ミックスナッツ,Official髭男dism,Anime
水平線,back number,J-Pop
シンデレラボーイ,Saucy Dog,J-Rock
なんでもないや,RADWIMPS,Anime
ひまわりの約束,秦基博,J-Pop
HANABI,Mr.Children,J-Pop
天体観測,BUMP OF CHICKEN,J-Rock
残酷な天使のテーゼ,高橋洋子,Anime
千本桜,黒うさP,Vocaloid,,練習中`;

  const [songs, setSongs] = useState<Song[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [adminBlogPosts, setAdminBlogPosts] = useState<BlogPost[]>([]);
  const [uiConfig, setUiConfig] = useState<UiConfig>(DEFAULT_UI_CONFIG);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  type Mode = 'search' | 'list' | 'ranking' | 'requests' | 'blog';
  const [mode, setMode] = useState<Mode>('search');
  const [rankings, setRankings] = useState<Record<string, number>>({});
  const [rankingList, setRankingList] = useState<RankingItem[]>([]);
  const [requestRankingList, setRequestRankingList] = useState<RequestRankingItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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
            blogRes,
            uiConfigRes,
        ] = await Promise.all([
            fetch('/api/songs'),
            fetch('/api/get-ranking'),
            fetch('/api/get-request-ranking'),
            fetch('/api/songs?action=getBlogPosts'),
            fetch('/api/songs?action=getUiConfig'),
        ]);

        if (!songsRes.ok) throw new Error('Songs fetch failed');
        const songsData = await songsRes.json();
        setSongs(parseSongs(songsData.list));

        if (rankingRes.ok) setRankingList(await rankingRes.json());
        if (reqRankingRes.ok) setRequestRankingList(await reqRankingRes.json());
        if (blogRes.ok) setBlogPosts(await blogRes.json());
        if (uiConfigRes.ok) setUiConfig({...DEFAULT_UI_CONFIG, ...await uiConfigRes.json()});

        setConnectionStatus('connected');
    } catch (error) {
        console.error("Failed to fetch data, using fallback:", error);
        setSongs(parseSongs(FALLBACK_SONGS_STR));
        setConnectionStatus('offline');
    } finally {
        setIsLoading(false);
    }
}, [parseSongs, FALLBACK_SONGS_STR]);

  const fetchRankings = useCallback(async () => {
      try {
          const response = await fetch('/api/get-ranking');
          if (!response.ok) throw new Error('Failed to fetch rankings');
          const data: RankingItem[] = await response.json();
          setRankingList(data);
          const rankingMap = data.reduce((acc, item) => {
              acc[item.id] = item.count;
              return acc;
          }, {} as Record<string, number>);
          setRankings(rankingMap);
      } catch (error) {
          console.error("Failed to fetch rankings:", error);
      }
  }, []);

  const fetchRequestRankings = useCallback(async () => {
      try {
          const response = await fetch('/api/get-request-ranking');
          if (!response.ok) throw new Error('Failed to fetch request rankings');
          setRequestRankingList(await response.json());
      } catch (error) { console.error("Failed to fetch request rankings:", error); }
  }, []);

  const fetchAdminBlogPosts = async () => {
      try {
          const res = await fetch('/api/songs?action=getAdminBlogPosts');
          if(res.ok) setAdminBlogPosts(await res.json());
      } catch (e) { console.error(e); }
  };
  
  useEffect(() => {
    fetchAllData();
    fetchRankings();
  }, [fetchAllData, fetchRankings]);
  
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', uiConfig.primaryColor);
  }, [uiConfig.primaryColor]);

  const handleSaveSongs = async (newListStr: string) => {
      await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ list: newListStr })
      });
      setSongs(parseSongs(newListStr));
  };

  const handleSavePost = async (post: Omit<BlogPost, 'createdAt'>) => {
      await fetch('/api/songs?action=saveBlogPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
      });
      await Promise.all([fetchAllData(), fetchAdminBlogPosts()]);
  };

  const handleDeletePost = async (id: string) => {
      await fetch('/api/songs?action=deleteBlogPost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
      });
      await Promise.all([fetchAllData(), fetchAdminBlogPosts()]);
  };

  const handleSaveUiConfig = async (config: UiConfig) => {
      await fetch('/api/songs?action=saveUiConfig', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
      });
      setUiConfig(config);
  };
  
  const logSearchTerm = async (term: string) => {
      if (!term) return;
      try {
        await fetch('/api/log-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term: term })
        });
      } catch (err) { console.error("Failed to log search term:", err); }
  };

  const handleSearch = async () => {
      const trimmedSearchTerm = searchTerm.trim();
      setRequestStatus('idle'); 
      
      if (trimmedSearchTerm === 'admin.passkey') {
          setIsAdminOpen(true);
          fetchAdminBlogPosts();
          setSearchTerm('');
          return;
      }
      
      if (!trimmedSearchTerm) { setSearchResults(null); return; }

      await logSearchTerm(trimmedSearchTerm);
      fetchRankings();

      setIsLoading(true);
      setSearchResults(null);
      
      setTimeout(() => {
          const lowerCaseSearchTerm = trimmedSearchTerm.toLowerCase();
          const allMatches = songs.filter(song => song.title.toLowerCase().includes(lowerCaseSearchTerm) || song.artist.toLowerCase().includes(lowerCaseSearchTerm));
          if (allMatches.length > 0) {
              setSearchResults({ status: 'found', songs: allMatches, searchTerm: trimmedSearchTerm });
          } else {
              const mentionedArtists = [...new Set(songs.map(s => s.artist))].filter(artist => lowerCaseSearchTerm.includes(artist.toLowerCase()));
              let relatedSongs: Song[] = [];
              if (mentionedArtists.length > 0) relatedSongs = songs.filter(s => mentionedArtists.some(ma => s.artist === ma));
              const uniqueRelatedSongs = Array.from(new Map(relatedSongs.map(item => [`${item.title}-${item.artist}`, item])).values());
              if (uniqueRelatedSongs.length > 0) setSearchResults({ status: 'related', songs: uniqueRelatedSongs.slice(0, 5), searchTerm: trimmedSearchTerm });
              else setSearchResults({ status: 'notFound', songs: [], searchTerm: trimmedSearchTerm });
          }
          setIsLoading(false);
      }, 300);
  };
  
  const handleRequestSong = async (term: string) => {
    if (!term) return;
    setRequestStatus('sending');
    try {
        const response = await fetch('/api/log-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term })
        });
        if (!response.ok) throw new Error('Server responded with an error');
        setRequestStatus('sent');
        fetchRequestRankings();
    } catch (err) {
        console.error("Failed to log request:", err);
        setRequestStatus('error');
    }
  };

  const handleCopyToClipboard = (text: string) => { navigator.clipboard.writeText(text); };
  
  const navButtonConfig = [
    {key: 'search', icon: SearchIcon},
    {key: 'list', icon: ListBulletIcon},
    {key: 'ranking', icon: TrendingUpIcon},
    {key: 'requests', icon: CloudUploadIcon},
    {key: 'blog', icon: NewspaperIcon},
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen">
        {connectionStatus !== 'connected' && (
            <div className={`fixed top-0 left-0 right-0 p-2 text-center text-sm z-50 transition-all duration-300 ${connectionStatus === 'connecting' ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-black'}`}>
                {connectionStatus === 'connecting' ? 'サーバーに接続中...' : 'サーバーに接続できませんでした。オフラインモードで表示しています。'}
            </div>
        )}
      <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" style={{backgroundImage: "url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop')"}}></div>
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-8 md:pt-24 md:pb-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-shadow-lg animate-fade-in">{uiConfig.mainTitle}</h1>
          <p className="text-gray-300 animate-fade-in" style={{animationDelay: '0.2s'}}>{uiConfig.subtitle}</p>
        </header>
        
        <div className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto md:flex md:flex-wrap md:justify-center md:gap-4 md:max-w-none">
            {navButtonConfig.map(btn => {
                const config = uiConfig.navButtons[btn.key as keyof typeof uiConfig.navButtons];
                if (!config.enabled) return null;
                return <NavButton key={btn.key} onClick={() => setMode(btn.key as Mode)} isActive={mode === btn.key} IconComponent={btn.icon} label={config.label} />
            })}
            {uiConfig.navButtons.suggest.enabled && 
                <NavButton onClick={() => setIsSuggestOpen(true)} isSpecial={true} IconComponent={GiftIcon} label={uiConfig.navButtons.suggest.label} className="col-span-2" />
            }
        </div>

        <main>
          {mode === 'search' && (
            <div className="animate-fade-in">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleSearch={handleSearch} disabled={isLoading} />
              <SearchResults results={searchResults} isLoading={isLoading} handleRequestSong={handleRequestSong} requestStatus={requestStatus} />
              <DonationBanner />
              <TwitcastBanner />
            </div>
          )}
          {mode === 'list' && <ListView songs={songs} rankings={rankings}/>}
          {mode === 'ranking' && <RankingView songs={songs} rankingList={rankingList} />}
          {mode === 'requests' && <RequestRankingView rankingList={requestRankingList} />}
          {mode === 'blog' && <BlogView posts={blogPosts} />}
        </main>
        
        <AdminModal 
            isOpen={isAdminOpen} 
            onClose={() => setIsAdminOpen(false)} 
            songs={songs} 
            posts={adminBlogPosts} 
            uiConfig={uiConfig}
            onSaveSongs={handleSaveSongs}
            onSavePost={handleSavePost}
            onDeletePost={handleDeletePost}
            onSaveUiConfig={handleSaveUiConfig}
        />
        <SuggestSongModal isOpen={isSuggestOpen} onClose={() => setIsSuggestOpen(false)} songs={songs} onSelect={handleCopyToClipboard}/>

      </div>
    </div>
  );
}

export default App;
