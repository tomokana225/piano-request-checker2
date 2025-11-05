import React from 'react';
import { RankingItem } from '../types';
import { TrendingUpIcon } from '../components/ui/Icons';

interface RankingViewProps {
    rankingList: RankingItem[];
}

export const RankingView: React.FC<RankingViewProps> = ({ rankingList }) => {
    
    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return <span className="font-bold text-gray-400">{rank}</span>;
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-3"><TrendingUpIcon className="w-8 h-8"/>検索人気曲ランキング</h2>
            {rankingList.length > 0 ? (
                <div className="space-y-3">
                    {rankingList.map((item, index) => (
                        <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl w-8 text-center">{getMedal(index + 1)}</div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{item.id}</h3>
                                    <p className="text-sm text-gray-400">{item.artist}</p>
                                </div>
                            </div>
                            <div className="text-lg font-semibold text-cyan-400">{item.count}回</div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-400 mt-8">ランキングデータを読み込んでいます...</p>
            )}
        </div>
    );
};
