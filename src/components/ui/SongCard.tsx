import React from 'react';
import { Song } from '../../types';
import { YouTubeIcon, DocumentTextIcon } from './Icons';

interface SongCardProps {
    song: Song;
}

// FIX: Redefined ActionButton to use explicit props type instead of React.FC to avoid potential issues with implicit `children` prop.
const ActionButton = ({ href, title, icon }: { href: string, title: string, icon: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="text-gray-400 hover:text-white transition-colors">
        {icon}
    </a>
);

export const SongCard: React.FC<SongCardProps> = ({ song }) => {
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`;
    const lyricsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${song.artist} ${song.title} 歌詞`)}`;

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex justify-between items-center">
            <div>
                <h3 className="font-bold text-lg text-white">{song.title}</h3>
                <p className="text-sm text-gray-400">{song.artist}</p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <div className="flex items-center gap-2">
                    {song.isNew && <span className="text-xs font-semibold bg-yellow-500 text-black px-2 py-1 rounded-full">NEW</span>}
                    {song.status === 'practicing' && <span className="text-xs font-semibold bg-blue-500 text-white px-2 py-1 rounded-full">練習中</span>}
                </div>
                <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />} />
                <ActionButton href={lyricsSearchUrl} title="歌詞を検索" icon={<DocumentTextIcon className="w-6 h-6" />} />
            </div>
        </div>
    );
};
