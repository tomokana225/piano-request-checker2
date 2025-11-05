import React, { useState, useEffect } from 'react';
import { Song } from '../../types';
import { XIcon } from '../../components/ui/Icons';

interface SuggestSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    onSelect: (text: string) => void;
}

export const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ isOpen, onClose, songs, onSelect }) => {
    const [suggestedSong, setSuggestedSong] = useState<Song | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isOpen && songs.length > 0) {
            suggestRandomSong();
        }
    }, [isOpen, songs]);

    const suggestRandomSong = () => {
        setIsCopied(false);
        const randomIndex = Math.floor(Math.random() * songs.length);
        setSuggestedSong(songs[randomIndex]);
    };

    const handleCopy = () => {
        if (suggestedSong) {
            const textToCopy = `${suggestedSong.title} / ${suggestedSong.artist}`;
            onSelect(textToCopy);
            setIsCopied(true);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md text-center p-8" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                <h2 className="text-2xl font-bold mb-4">今日のイチオシ！</h2>
                {suggestedSong && (
                    <div className="mb-6">
                        <p className="text-3xl font-bold text-cyan-400" style={{color: 'var(--primary-color)'}}>{suggestedSong.title}</p>
                        <p className="text-lg text-gray-300">{suggestedSong.artist}</p>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={suggestRandomSong} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">もう一回</button>
                    <button onClick={handleCopy} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"  style={{backgroundColor: 'var(--primary-color)'}}>
                        {isCopied ? 'コピーしました！' : 'この曲をコピー'}
                    </button>
                </div>
            </div>
        </div>
    );
};
