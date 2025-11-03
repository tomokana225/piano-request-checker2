import React, { useState, useCallback } from 'react';
import type { Song, YamahaAPIResponse } from './types.ts';
import { PLAYABLE_SONGS_EXAMPLE } from './constants.ts';
import { checkPrintGakufu } from './services/geminiService.ts';
import SearchBar from './components/SearchBar.tsx';
import ResultsDisplay from './components/ResultsDisplay.tsx';
import SettingsModal from './components/SettingsModal.tsx';

const defaultPlayableList = PLAYABLE_SONGS_EXAMPLE.map(s => `${s.title},${s.artist}`).join('\n');

// In a real app, this would not be hardcoded
const ADMIN_PASSWORD = 'admin123';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState<string>('');
  const [playableListInput, setPlayableListInput] = useState(defaultPlayableList);
  const [playableListResult, setPlayableListResult] = useState<Song[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // State for Yamaha API call
  const [isYamahaLoading, setIsYamahaLoading] = useState<boolean>(false);
  const [yamahaApiError, setYamahaApiError] = useState<string | null>(null);
  const [yamahaApiResponse, setYamahaApiResponse] = useState<YamahaAPIResponse | null>(null);


  const handleLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
        setIsLoggedIn(true);
        return true;
    }
    return false;
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
  }
  
  const executeSearch = useCallback(async (term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) {
        setError("検索キーワードを入力してください。");
        setHasSearched(true);
        setPlayableListResult([]);
        setSubmittedSearchTerm('');
        setYamahaApiResponse(null);
        setYamahaApiError(null);
        return;
    }

    setError(null);
    setHasSearched(true);
    setSubmittedSearchTerm(trimmedTerm);
    
    // Reset previous API results
    setYamahaApiResponse(null);
    setYamahaApiError(null);

    // 1. Search local list
    const lowercasedTerm = trimmedTerm.toLowerCase();
    const lines = playableListInput.split('\n');
    const songsFromInput: Song[] = lines
      .map(line => {
        const parts = line.split(/[,、]/); // Handle comma and Japanese comma
        if (parts.length >= 2) {
          return { title: parts[0].trim(), artist: parts[1].trim() };
        }
        return null;
      })
      .filter((song): song is Song => song !== null && (song.title !== '' || song.artist !== ''));
    
    const filteredSongs = songsFromInput.filter(
      (song) =>
        song.title.toLowerCase().includes(lowercasedTerm) ||
        song.artist.toLowerCase().includes(lowercasedTerm)
    );
    setPlayableListResult(filteredSongs);
    
    // 2. Search Yamaha Print Gakufu via API
    setIsYamahaLoading(true);
    try {
        const result = await checkPrintGakufu(trimmedTerm);
        setYamahaApiResponse(result);
    } catch (e) {
        setYamahaApiError(e instanceof Error ? e.message : '不明なエラーが発生しました。');
    } finally {
        setIsYamahaLoading(false);
    }

  }, [playableListInput]);

  const handleSearch = useCallback(async () => {
    const trimmedSearchTerm = searchTerm.trim();

    if (trimmedSearchTerm === '管理.passkey') {
      setIsSettingsOpen(true);
      setSearchTerm(''); // Clear the search term after opening settings
      return;
    }
    
    await executeSearch(trimmedSearchTerm);

  }, [searchTerm, executeSearch]);
  

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at top right, #4f46e5, transparent 50%), radial-gradient(circle at bottom left, #db2777, transparent 50%)',
        }}
      ></div>
      <main className="relative z-10 container mx-auto max-w-4xl flex flex-col items-center">
        <header className="text-center my-8 md:my-12">
            <div className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold">Piano Request Checker</h1>
            </div>
            <p className="text-lg text-gray-300 mt-2">ピアノ配信でリクエストする前に、弾ける曲かチェック！</p>
        </header>

        <section className="w-full">
          <SearchBar 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            isLoading={isYamahaLoading}
          />
        </section>
        
        <section className="w-full mt-6 flex justify-center">
            <ResultsDisplay
                error={error}
                playableListResult={playableListResult}
                hasSearched={hasSearched}
                searchTerm={submittedSearchTerm}
                isYamahaLoading={isYamahaLoading}
                yamahaApiError={yamahaApiError}
                yamahaApiResponse={yamahaApiResponse}
            />
        </section>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>&copy; 2024 Piano Request Checker. For demonstration purposes only.</p>
        </footer>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        listInput={playableListInput}
        setListInput={setPlayableListInput}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;