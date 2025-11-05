import React, { useState, useMemo } from 'react';
import { Song } from '../types';

interface ListViewProps {
    songs: Song[];
    rankings: Record<string, number>;
}

export const ListView: React.FC<ListViewProps> = ({ songs, rankings }) => {
    const [sortKey, setSortKey] = useState<'title' | 'artist' | 'ranking'>('title');

    const sortedSongs = useMemo(() => {
        return [...songs].sort((a, b) => {
            if (sortKey === 'ranking') {
                const rankA = rankings[a.title] || Infinity;
                const rankB = rankings[b.title] || Infinity;
                return rankA - rankB;
            }
            if (a[sortKey] < b[sortKey]) return -1;
            if (a[sortKey] > b[sortKey]) return 1;
            return 0;
        });
    }, [songs, sortKey, rankings]);

    const SortButton: React.FC<{ sKey: 'title' | 'artist' | 'ranking'; label: string }> = ({ sKey, label }) => (
        <button
            onClick={() => setSortKey(sKey)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${sortKey === sKey ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
             style={{backgroundColor: sortKey === sKey ? 'var(--primary-color)' : ''}}
        >
            {label}
        </button>
    );

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-center gap-4 mb-6">
                <SortButton sKey="title" label="曲名順" />
                <SortButton sKey="artist" label="アーティスト順" />
                <SortButton sKey="ranking" label="人気順" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSongs.map((song, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-between">
                        <div>
                            {rankings[song.title] && <span className="text-xs font-bold text-yellow-400">人気{rankings[song.title]}位</span>}
                            <h3 className="font-bold text-lg text-white mt-1">{song.title}</h3>
                            <p className="text-sm text-gray-400">{song.artist}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            {song.isNew && <span className="text-xs font-semibold bg-yellow-500 text-black px-2 py-1 rounded-full">NEW</span>}
                            {song.status === 'practicing' && <span className="text-xs font-semibold bg-blue-500 text-white px-2 py-1 rounded-full">練習中</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
