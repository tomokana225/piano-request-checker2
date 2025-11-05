import React, { useState, useEffect, useMemo } from 'react';

import { useApi } from './hooks/useApi';
import { Mode } from './types';

import { NavButton } from './components/ui/NavButton';
import { SearchIcon, ListBulletIcon, TrendingUpIcon, CloudUploadIcon, NewspaperIcon, GiftIcon, VideoCameraIcon, HeartIcon } from './components/ui/Icons';
import { SearchView } from './views/SearchView';
import { ListView } from './views/ListView';
import { RankingView } from './views/RankingView';
import { RequestRankingView } from './views/RequestRankingView';
import { BlogView } from './views/BlogView';
import { AdminModal } from './features/admin/AdminModal';
import { SuggestSongModal } from './features/suggest/SuggestSongModal';
import { SupportModal } from './features/support/SupportModal';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// --- MAIN APP COMPONENT ---
function App() {
  const {
    songs,
    blogPosts,
    adminBlogPosts,
    uiConfig,
    rankingList,
    requestRankingList,
    rankings,
    connectionStatus,
    isLoading: isApiLoading,
    handleSaveSongs,
    handleSavePost,
    handleDeletePost,
    handleSaveUiConfig,
    logSearchTerm,
    logRequest,
    fetchAdminBlogPosts,
    fetchRankings,
    fetchRequestRankings,
  } = useApi();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('search');
  
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', uiConfig.primaryColor);
    document.title = uiConfig.mainTitle;
  }, [uiConfig.primaryColor, uiConfig.mainTitle]);

  const handleAdminOpen = () => {
      fetchAdminBlogPosts();
      setIsAdminOpen(true);
      setSearchTerm('');
  };

  const handleCopyToClipboard = (text: string) => { 
    navigator.clipboard.writeText(text); 
  };
  
  const navButtonConfig = useMemo(() => [
    {key: 'search' as Mode, icon: SearchIcon},
    {key: 'list' as Mode, icon: ListBulletIcon},
    {key: 'ranking' as Mode, icon: TrendingUpIcon},
    {key: 'requests' as Mode, icon: CloudUploadIcon},
    {key: 'blog' as Mode, icon: NewspaperIcon},
  ], []);

  const hasSupportLinks = useMemo(() => {
    return !!uiConfig.ofuseUrl || !!uiConfig.doneruUrl || !!uiConfig.amazonWishlistUrl;
  }, [uiConfig]);

  const renderCurrentView = () => {
    switch(mode) {
      case 'search':
        return <SearchView 
                  songs={songs} 
                  searchTerm={searchTerm} 
                  setSearchTerm={setSearchTerm} 
                  onAdminOpen={handleAdminOpen}
                  logSearchTerm={logSearchTerm}
                  logRequest={logRequest}
                  fetchRankings={fetchRankings}
                  fetchRequestRankings={fetchRequestRankings}
                />;
      case 'list':
        return <ListView songs={songs} rankings={rankings}/>;
      case 'ranking':
        return <RankingView rankingList={rankingList} />;
      case 'requests':
        return <RequestRankingView rankingList={requestRankingList} />;
      case 'blog':
        return <BlogView posts={blogPosts} />;
      default:
        return null;
    }
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col" style={{'--primary-color': uiConfig.primaryColor} as React.CSSProperties}>
        {connectionStatus !== 'connected' && (
            <div className={`fixed top-0 left-0 right-0 p-2 text-center text-sm z-50 transition-all duration-300 ${connectionStatus === 'connecting' ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-black'}`}>
                {connectionStatus === 'connecting' ? 'サーバーに接続中...' : 'サーバーに接続できませんでした。オフラインモードで表示しています。'}
            </div>
        )}
      <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" style={{backgroundImage: "url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop')"}}></div>
      
      <div className="relative z-10 flex-grow container mx-auto px-4 pt-20 pb-24 md:pt-24">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-shadow-lg animate-fade-in" style={{color: uiConfig.primaryColor}}>{uiConfig.mainTitle}</h1>
          <p className="text-gray-300 animate-fade-in" style={{animationDelay: '0.2s'}}>{uiConfig.subtitle}</p>
          <div className="mt-4 flex flex-wrap justify-center items-center gap-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
            {uiConfig.twitcastingUrl && (
              <a 
                href={uiConfig.twitcastingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white font-semibold transform hover:scale-105"
              >
                <VideoCameraIcon className="w-5 h-5 text-cyan-400" />
                <span>ライブ配信はこちら</span>
              </a>
            )}
             {hasSupportLinks && (
               <button 
                onClick={() => setIsSupportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors text-white font-semibold transform hover:scale-105"
              >
                <HeartIcon className="w-5 h-5" />
                <span>サポートする</span>
              </button>
            )}
          </div>
        </header>
        
        <main>
          {isApiLoading && mode !== 'search' ? (
             <div className="w-full max-w-2xl mx-auto mt-8 p-6 text-center flex items-center justify-center gap-4">
                <LoadingSpinner className="w-6 h-6 text-gray-400" />
                <p className="text-lg text-gray-300">読み込み中...</p>
            </div>
          ) : renderCurrentView() }
        </main>
      </div>
      
      <nav className="sticky bottom-0 z-20 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700">
          <div className="container mx-auto p-2">
              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                  {navButtonConfig.map(btn => {
                      const config = uiConfig.navButtons[btn.key];
                      if (!config.enabled) return null;
                      return <NavButton key={btn.key} onClick={() => setMode(btn.key)} isActive={mode === btn.key} IconComponent={btn.icon} label={config.label} />
                  })}
                  {uiConfig.navButtons.suggest.enabled && 
                      <NavButton onClick={() => setIsSuggestOpen(true)} IconComponent={GiftIcon} label={uiConfig.navButtons.suggest.label} />
                  }
              </div>
          </div>
      </nav>
        
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
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} uiConfig={uiConfig} />
    </div>
  );
}

export default App;