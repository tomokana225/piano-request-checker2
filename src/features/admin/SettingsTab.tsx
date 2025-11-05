import React, { useState, useEffect } from 'react';
import { UiConfig, NavButtonConfig } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface SettingsTabProps {
    uiConfig: UiConfig;
    onSaveUiConfig: (config: UiConfig) => Promise<boolean>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ uiConfig, onSaveUiConfig }) => {
    const [config, setConfig] = useState<UiConfig>(uiConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        setConfig(uiConfig);
    }, [uiConfig]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };
    
    const handleNavChange = (key: keyof UiConfig['navButtons'], field: keyof NavButtonConfig, value: string | boolean) => {
        setConfig(prev => ({
            ...prev,
            navButtons: {
                ...prev.navButtons,
                [key]: {
                    ...prev.navButtons[key],
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const success = await onSaveUiConfig(config);
        setSaveStatus(success ? 'success' : 'error');
        setIsSaving(false);
        setTimeout(() => setSaveStatus('idle'), 3000);
    };
    
    const navButtonKeys: (keyof UiConfig['navButtons'])[] = ['search', 'list', 'ranking', 'requests', 'blog', 'suggest'];

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">基本設定</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">メインタイトル</label>
                    <input type="text" name="mainTitle" value={config.mainTitle} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">サブタイトル</label>
                    <input type="text" name="subtitle" value={config.subtitle} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">ツイキャスURL</label>
                    <input type="text" name="twitcastingUrl" value={config.twitcastingUrl || ''} onChange={handleInputChange} placeholder="https://twitcasting.tv/..." className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] sm:text-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">テーマカラー</label>
                    <input type="color" name="primaryColor" value={config.primaryColor} onChange={handleInputChange} className="mt-1 h-10 w-full block bg-gray-700 border-gray-600 rounded-md p-1" />
                </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-8">ナビゲーションボタン設定</h3>
            <div className="space-y-3">
                {navButtonKeys.map(key => (
                    <div key={key} className="bg-gray-800 p-3 rounded-md flex items-center gap-4">
                        <input type="checkbox" checked={config.navButtons[key].enabled} onChange={(e) => handleNavChange(key, 'enabled', e.target.checked)} className="form-checkbox h-5 w-5 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" />
                        <div className="flex-grow">
                             <input type="text" value={config.navButtons[key].label} onChange={(e) => handleNavChange(key, 'label', e.target.value)} className="w-full bg-gray-700 p-1.5 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-4">
                 {saveStatus === 'success' && <p className="text-green-400">保存しました！</p>}
                {saveStatus === 'error' && <p className="text-red-400">保存に失敗しました。</p>}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? <LoadingSpinner className="w-5 h-5" /> : null}
                    {isSaving ? '保存中...' : '設定を保存'}
                </button>
            </div>
        </div>
    );
};