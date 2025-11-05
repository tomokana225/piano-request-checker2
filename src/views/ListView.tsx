import React, { useState, useMemo } from 'react';
import { Song } from '../types';
import { ChevronRightIcon, ChevronLeftIcon } from '../components/ui/Icons';
import { SongCard } from '../components/ui/SongCard';

interface ListViewProps {
    songs: Song[];
}

type ViewState =
    { mode: 'all' } |
    { mode: 'artist_select' } |
    { mode: 'genre_select' } |
    { mode: 'by_artist', artist: string } |
    { mode: 'by_genre', genre: string };

export const ListView: React.FC<ListViewProps> = ({ songs }) => {
    const [viewState, setViewState] = useState<ViewState>({ mode: 'all' });

    // FIX: Explicitly type sort callback parameters 'a' and 'b' as strings to prevent them from being inferred as 'unknown'.
    const artists = useMemo(() => [...new Set(songs.map(s => s.artist))].sort((a: string, b: string) => a.localeCompare(b, 'ja')), [songs]);
    // FIX: Explicitly type sort callback parameters 'a' and 'b' as strings to prevent them from being inferred as 'unknown'.
    const genres = useMemo(() => [...new Set(songs.map(s => s.genre).filter(Boolean))].sort((a: string, b: string) => a.localeCompare(b, 'ja')), [songs]);
    const sortedSongs = useMemo(() => [...songs].sort((a, b) => a.title.localeCompare(b.title, 'ja')), [songs]);

    const handleBack = () => {
        if (viewState.mode === 'by_artist') {
            setViewState({ mode: 'artist_select' });
        } else if (viewState.mode === 'by_genre') {
            setViewState({ mode: 'genre_select' });
        }
    };
    
    const renderContent = () => {
        switch (viewState.mode) {
            case 'artist_select':
                return (
                    <div className="space-y-2">
                        {artists.map(artist => (
                             <div key={artist} onClick={() => setViewState({ mode: 'by_artist', artist })} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors">
                                <span className="font-semibold">{artist}</span>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </div>
                        ))}
                    </div>
                );
            case 'genre_select':
                return (
                    <div className="space-y-2">
                        {genres.map(genre => (
                             <div key={genre} onClick={() => setViewState({ mode: 'by_genre', genre })} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors">
                                <span className="font-semibold">{genre}</span>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </div>
                        ))}
                    </div>
                );
            case 'by_artist':
                const songsByArtist = songs.filter(s => s.artist === viewState.artist).sort((a, b) => a.title.localeCompare(b.title, 'ja'));
                return (
                    <div className="space-y-3">
                         {songsByArtist.map((song, index) => <SongCard key={`${song.title}-${index}`} song={song} />)}
                    </div>
                );
             case 'by_genre':
                const songsByGenre = songs.filter(s => s.genre === viewState.genre).sort((a, b) => a.title.localeCompare(b.title, 'ja'));
                return (
                    <div className="space-y-3">
                         {songsByGenre.map((song, index) => <SongCard key={`${song.title}-${index}`} song={song} />)}
                    </div>
                );
            case 'all':
            default:
                return (
                     <div className="space-y-3">
                        {sortedSongs.map((song, index) => <SongCard key={`${song.title}-${index}`} song={song} />)}
                    </div>
                );
        }
    };

    const ModeButton: React.FC<{ mode: ViewState['mode'], label: string }> = ({ mode, label }) => {
        const isActive = viewState.mode === mode || 
                         (mode === 'artist_select' && viewState.mode === 'by_artist') || 
                         (mode === 'genre_select' && viewState.mode === 'by_genre');
        return (
            <button
                onClick={() => setViewState({ mode: mode as any })}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${isActive ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                style={{backgroundColor: isActive ? 'var(--primary-color)' : ''}}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
             <div className="mb-6">
                <div className="flex justify-center gap-4">
                    <ModeButton mode="all" label="曲名順" />
                    <ModeButton mode="artist_select" label="アーティスト別" />
                    <ModeButton mode="genre_select" label="ジャンル別" />
                </div>
                 <p className="text-center text-gray-400 mt-4">全{songs.length}曲</p>
             </div>
             
             {(viewState.mode === 'by_artist' || viewState.mode === 'by_genre') && (
                <div className="mb-4">
                    <button onClick={handleBack} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-semibold mb-2">
                        <ChevronLeftIcon className="w-4 h-4" />
                        <span>{viewState.mode === 'by_artist' ? 'アーティスト一覧に戻る' : 'ジャンル一覧に戻る'}</span>
                    </button>
                    <h2 className="text-2xl font-bold text-center text-white">
                        {viewState.mode === 'by_artist' ? viewState.artist : viewState.genre}
                    </h2>
                </div>
            )}
             
            {renderContent()}
        </div>
    );
};