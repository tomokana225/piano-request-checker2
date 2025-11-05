import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface SongListTabProps {
    onSaveSongs: (newSongList: string) => Promise<boolean>;
}

export const SongListTab: React.FC<SongListTabProps> = ({ onSaveSongs }) => {
    const { rawSongList, isLoading } = useApi();
    const [currentSongList, setCurrentSongList] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (rawSongList) {
            setCurrentSongList(rawSongList);
        }
    }, [rawSongList]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        const success = await onSaveSongs(currentSongList);
        setSaveStatus(success ? 'success' : 'error');
        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
    };

    if (isLoading && !rawSongList) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner className="w-8 h-8"/></div>
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">曲リストを編集</h3>
            <p className="text-sm text-gray-400 mb-4">
                <code>曲名,アーティスト名,ジャンル,new,練習中</code> の形式で入力してください。ジャンル以降は省略可能です。
            </p>
            <textarea
                value={currentSongList}
                onChange={(e) => setCurrentSongList(e.target.value)}
                className="w-full h-96 bg-gray-800 border border-gray-700 rounded-md p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] custom-scrollbar"
                placeholder="夜に駆ける,YOASOBI,J-Pop,new..."
            />
            <div className="mt-4 flex items-center justify-end gap-4">
                {saveStatus === 'success' && <p className="text-green-400">保存しました！</p>}
                {saveStatus === 'error' && <p className="text-red-400">保存に失敗しました。</p>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                    {isSaving ? '保存中...' : '保存する'}
                </button>
            </div>
        </div>
    );
};
