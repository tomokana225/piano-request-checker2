import React, { useState, useMemo, useCallback } from 'react';
import { Song, SearchResult } from '../types';
import { SearchIcon, XIcon, ExternalLinkIcon, CheckCircleIcon, CloudUploadIcon } from '../components/ui/Icons';
import { normalizeForSearch } from '../utils/normalization';
import { SongCard } from '../components/ui/SongCard';

interface SearchViewProps {
    songs: Song[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onAdminOpen: () => void;
    logSearchTerm: (term: string) => void;
    logRequest: (term: string) => void;
    fetchRankings: () => void;
    fetchRequestRankings: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ songs, searchTerm, setSearchTerm, onAdminOpen, logSearchTerm, logRequest, fetchRankings, fetchRequestRankings }) => {
    const [lastLoggedTerm, setLastLoggedTerm] = useState('');
    const [isRequested, setIsRequested] = useState(false);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setIsRequested(false); 
    }, [setSearchTerm]);

    const handleRequest = () => {
        logRequest(searchTerm);
        setIsRequested(true);
        fetchRequestRankings();
    };

    const searchResult: SearchResult = useMemo(() => {
        const normalizedSearch = normalizeForSearch(searchTerm);
        if (normalizedSearch.length === 0) return { status: 'notFound', songs: [], searchTerm: '' };

        if (searchTerm.toLowerCase().replace(/\s+/g, '') === 'admin') {
            onAdminOpen();
            return { status: 'notFound', songs: [], searchTerm: '' };
        }

        const foundSongs = songs.filter(song => 
            normalizeForSearch(song.title).includes(normalizedSearch) || 
            normalizeForSearch(song.artist).includes(normalizedSearch)
        );

        if (foundSongs.length > 0) {
            if (lastLoggedTerm !== normalizedSearch) {
                logSearchTerm(searchTerm);
                setLastLoggedTerm(normalizedSearch);
                fetchRankings();
            }
            return { status: 'found', songs: foundSongs, searchTerm };
        }
        
        return { status: 'notFound', songs: [], searchTerm };
    }, [searchTerm, songs, onAdminOpen, logSearchTerm, fetchRankings, lastLoggedTerm]);

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <div className="relative mb-6">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                    type="text"
                    placeholder="曲名やアーティスト名で検索..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-gray-800 border-2 border-gray-700 rounded-full py-3 pl-12 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition"
                />
                {searchTerm && <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2"><XIcon className="w-6 h-6 text-gray-400 hover:text-white" /></button>}
            </div>

            {searchResult.status === 'found' && (
                <div>
                    <h2 className="text-xl font-bold mb-4 text-center text-green-400">レパートリーにあります！</h2>
                    <div className="space-y-3">
                        {searchResult.songs.map(song => <SongCard key={`${song.title}-${song.artist}`} song={song} />)}
                    </div>
                </div>
            )}

            {searchResult.status !== 'found' && searchTerm.length > 0 && (
                <div className="text-center p-6 bg-gray-800 rounded-lg">
                    <h2 className="text-xl font-bold mb-4 text-yellow-400">レパートリーにないようです</h2>
                    <p className="text-gray-300 mb-6">
                        ぷりんと楽譜で販売されている可能性があります。
                        <br />
                        また、今後の参考のために曲をリクエストできます。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href={`https://www.print-gakufu.com/search/result/keyword__${encodeURIComponent(searchTerm)}/`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
                            <ExternalLinkIcon className="w-5 h-5" />
                            ぷりんと楽譜で探す
                        </a>
                        <button onClick={handleRequest} disabled={isRequested} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105 ${isRequested ? 'bg-green-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
                            {isRequested ? <CheckCircleIcon className="w-5 h-5" /> : <CloudUploadIcon className="w-5 h-5" />}
                            {isRequested ? 'リクエストしました！' : 'この曲をリクエスト'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
