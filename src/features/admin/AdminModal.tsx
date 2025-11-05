import React, { useState } from 'react';
import { Song, BlogPost, UiConfig } from '../../types';
import { XIcon } from '../../components/ui/Icons';
import { SongListTab } from './SongListTab';
import { BlogTab } from './BlogTab';
import { SettingsTab } from './SettingsTab';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    posts: BlogPost[];
    uiConfig: UiConfig;
    onSaveSongs: (newSongList: string) => Promise<boolean>;
    onSavePost: (post: Omit<BlogPost, 'createdAt'>) => Promise<boolean>;
    onDeletePost: (id: string) => Promise<boolean>;
    onSaveUiConfig: (config: UiConfig) => Promise<boolean>;
}

type AdminTab = 'songs' | 'blog' | 'settings';

export const AdminModal: React.FC<AdminModalProps> = (props) => {
    const { isOpen, onClose } = props;
    const [activeTab, setActiveTab] = useState<AdminTab>('songs');

    if (!isOpen) return null;

    const TabButton: React.FC<{ tab: AdminTab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${activeTab === tab ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold">管理パネル</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                </header>
                <div className="border-b border-gray-700 px-4">
                    <nav className="flex space-x-2">
                        <TabButton tab="songs" label="曲リスト管理" />
                        <TabButton tab="blog" label="ブログ管理" />
                        <TabButton tab="settings" label="アプリ設定" />
                    </nav>
                </div>
                <main className="flex-grow p-6 overflow-y-auto custom-scrollbar min-h-0">
                    {activeTab === 'songs' && <SongListTab {...props} />}
                    {activeTab === 'blog' && <BlogTab {...props} />}
                    {activeTab === 'settings' && <SettingsTab {...props} />}
                </main>
            </div>
        </div>
    );
};