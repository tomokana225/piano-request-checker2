import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Song } from '../../types';
import { XIcon, YouTubeIcon, DocumentTextIcon } from '../../components/ui/Icons';

interface SuggestSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    onSelect: (text: string) => void;
}

type GamePhase = 'idle' | 'spinning' | 'result';

export const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ isOpen, onClose, songs, onSelect }) => {
    const [suggestedSong, setSuggestedSong] = useState<Song | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const spinIntervalRef = useRef<number | null>(null);

    const startSpin = useCallback(() => {
        if (songs.length === 0) return;

        setIsCopied(false);
        setGamePhase('spinning');

        spinIntervalRef.current = window.setInterval(() => {
            const randomIndex = Math.floor(Math.random() * songs.length);
            setSuggestedSong(songs[randomIndex]);
        }, 50);

        setTimeout(() => {
            if (spinIntervalRef.current) {
                clearInterval(spinIntervalRef.current);
                spinIntervalRef.current = null;
            }
            setGamePhase('result');
        }, 1500);

    }, [songs]);

    useEffect(() => {
        if (!isOpen) {
            setGamePhase('idle');
            setSuggestedSong(null);
            setIsCopied(false);
            if (spinIntervalRef.current) {
                clearInterval(spinIntervalRef.current);
                spinIntervalRef.current = null;
            }
        }
    }, [isOpen]);


    const handleCopy = () => {
        if (suggestedSong) {
            const textToCopy = `${suggestedSong.title} / ${suggestedSong.artist}`;
            onSelect(textToCopy);
            setIsCopied(true);
        }
    };
    
    if (!isOpen) return null;

    const renderContent = () => {
        switch (gamePhase) {
            case 'spinning':
            case 'result':
                return suggestedSong ? (
                    <div className="h-[92px] flex flex-col items-center justify-center">
                        <p className="text-3xl font-bold" style={{color: 'var(--primary-color)'}}>{suggestedSong.title}</p>
                        <p className="text-lg text-gray-300">{suggestedSong.artist}</p>
                        {gamePhase === 'result' && (
                             <div className="flex items-center gap-4 mt-4">
                                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${suggestedSong.artist} ${suggestedSong.title}`)}`} target="_blank" rel="noopener noreferrer" title="YouTubeで検索" className="text-gray-400 hover:text-white transition-colors">
                                    <YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />
                                </a>
                                <a href={`https://www.google.com/search?q=${encodeURIComponent(`${suggestedSong.artist} ${suggestedSong.title} 歌詞`)}`} target="_blank" rel="noopener noreferrer" title="歌詞を検索" className="text-gray-400 hover:text-white transition-colors">
                                    <DocumentTextIcon className="w-6 h-6" />
                                </a>
                            </div>
                        )}
                    </div>
                ) : null;
            case 'idle':
            default:
                return (
                    <div className="h-[92px] flex items-center justify-center">
                        <p className="text-lg text-gray-400">何にする？</p>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md text-center p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" disabled={gamePhase === 'spinning'}>
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-4">今日のイチオシ！</h2>
                <div className="mb-6 h-[92px] flex flex-col items-center justify-center">
                   {renderContent()}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {gamePhase === 'idle' ? (
                        <button onClick={startSpin} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                            スタート
                        </button>
                    ) : (
                        <button onClick={startSpin} disabled={gamePhase === 'spinning'} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                            もう一回
                        </button>
                    )}
                    <button onClick={handleCopy} disabled={gamePhase !== 'result'} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{backgroundColor: 'var(--primary-color)'}}>
                        {isCopied ? 'コピーしました！' : 'この曲をコピー'}
                    </button>
                </div>
            </div>
        </div>
    );
};
