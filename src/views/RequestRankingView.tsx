import React from 'react';
import { RequestRankingItem } from '../types';
import { CloudUploadIcon } from '../components/ui/Icons';

interface RequestRankingViewProps {
    rankingList: RequestRankingItem[];
}

export const RequestRankingView: React.FC<RequestRankingViewProps> = ({ rankingList }) => {
    
    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return <span className="font-bold text-gray-400">{rank}</span>;
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-3"><CloudUploadIcon className="w-8 h-8"/>リクエスト曲ランキング</h2>
             {rankingList.length > 0 ? (
                <div className="space-y-3">
                    {rankingList.map((item, index) => (
                        <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl w-8 text-center">{getMedal(index + 1)}</div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{item.id}</h3>
                                </div>
                            </div>
                            <div className="text-lg font-semibold text-purple-400">{item.count}回</div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-center text-gray-400 mt-8">まだリクエストされた曲はありません。</p>
            )}
        </div>
    );
};
