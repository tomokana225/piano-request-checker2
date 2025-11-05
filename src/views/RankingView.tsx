import React, { useState } from 'react';
import { RankingItem, ArtistRankingItem } from '../types';
import { TrendingUpIcon, YouTubeIcon, DocumentTextIcon } from '../components/ui/Icons';

interface RankingViewProps {
    songRankingList: RankingItem[];
    artistRankingList: ArtistRankingItem[];
}

type RankingTab = 'song' | 'artist';

export const RankingView: React.FC<RankingViewProps> = ({ songRankingList, artistRankingList }) => {
    const [activeTab, setActiveTab] = useState<RankingTab>('song');

    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return <span className="font-bold text-gray-400">{rank}</span>;
    };
    
    const ActionButton: React.FC<{ href: string, title: string, icon: React.ReactNode }> = ({ href, title, icon }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="text-gray-400 hover:text-white transition-colors">
            {icon}
        </a>
    );

    const TabButton: React.FC<{ tab: RankingTab, label: string }> = ({ tab, label }) => (
         <button
            onClick={() => setActiveTab(tab)}
            className={`w-full py-2.5 text-sm font-semibold rounded-md transition ${activeTab === tab ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            style={{backgroundColor: activeTab === tab ? 'var(--primary-color)' : ''}}
        >
            {label}
        </button>
    );

    const renderSongRanking = () => (
        <div className="space-y-3">
            {songRankingList.map((item, index) => {
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.id}`)}`;
                const lyricsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${item.artist} ${item.id} 歌詞`)}`;
                return (
                    <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                            <div className="text-2xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-lg text-white truncate">{item.id}</h3>
                                <p className="text-sm text-gray-400 truncate">{item.artist}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                            <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />} />
                            <ActionButton href={lyricsSearchUrl} title="歌詞を検索" icon={<DocumentTextIcon className="w-5 h-5" />} />
                            <div className="text-lg font-semibold text-cyan-400 hidden sm:block">{item.count}回</div>
                        </div>
                    </div>
                )
            })}
        </div>
    );

    const renderArtistRanking = () => (
         <div className="space-y-3">
            {artistRankingList.map((item, index) => (
                <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="text-2xl w-8 text-center">{getMedal(index + 1)}</div>
                        <div>
                            <h3 className="font-bold text-lg text-white">{item.id}</h3>
                        </div>
                    </div>
                    <div className="text-lg font-semibold text-cyan-400">{item.count}回</div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-4 flex items-center justify-center gap-3"><TrendingUpIcon className="w-8 h-8"/>検索人気ランキング</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <TabButton tab="song" label="曲別" />
                <TabButton tab="artist" label="アーティスト別" />
            </div>

            {activeTab === 'song' && (songRankingList.length > 0 ? renderSongRanking() : <p className="text-center text-gray-400 mt-8">ランキングデータを読み込んでいます...</p>)}
            {activeTab === 'artist' && (artistRankingList.length > 0 ? renderArtistRanking() : <p className="text-center text-gray-400 mt-8">ランキングデータを読み込んでいます...</p>)}
        </div>
    );
};
