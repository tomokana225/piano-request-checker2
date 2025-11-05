import React from 'react';
import { UiConfig } from '../../types';
import { XIcon, ExternalLinkIcon, HeartIcon } from '../../components/ui/Icons';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    uiConfig: UiConfig;
}

const SupportLinkButton: React.FC<{ href: string; label: string }> = ({ href, label }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full text-center px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-transform transform hover:scale-105"
    >
        {label}
        <ExternalLinkIcon className="w-5 h-5" />
    </a>
);


export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, uiConfig }) => {
    if (!isOpen) return null;

    const hasLinks = uiConfig.ofuseUrl || uiConfig.doneruUrl || uiConfig.amazonWishlistUrl;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md text-center p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                <div className="flex justify-center items-center gap-3 mb-4">
                    <HeartIcon className="w-8 h-8 text-pink-500" />
                    <h2 className="text-2xl font-bold">配信者をサポートする</h2>
                </div>
                
                {hasLinks ? (
                    <div className="space-y-4 mt-6">
                        {uiConfig.ofuseUrl && <SupportLinkButton href={uiConfig.ofuseUrl} label="OFUSE で応援する" />}
                        {uiConfig.doneruUrl && <SupportLinkButton href={uiConfig.doneruUrl} label="Doneru で支援する" />}
                        {uiConfig.amazonWishlistUrl && <SupportLinkButton href={uiConfig.amazonWishlistUrl} label="ほしい物リストを見る" />}
                    </div>
                ) : (
                    <p className="text-gray-400 mt-6">現在設定されているサポートリンクはありません。</p>
                )}
            </div>
        </div>
    );
};