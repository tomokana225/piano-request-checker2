import React from 'react';
import type { Song, YamahaAPIResponse } from '../types.ts';
import { YamahaCheckResult } from '../types.ts';
import { XCircleIcon, MusicNoteIcon, ExternalLinkIcon, InfoCircleIcon, CheckCircleIcon, QuestionMarkCircleIcon } from './IconComponents.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';

interface ResultsDisplayProps {
  error: string | null;
  playableListResult: Song[];
  hasSearched: boolean;
  searchTerm: string;
  // Yamaha API related props
  isYamahaLoading: boolean;
  yamahaApiError: string | null;
  yamahaApiResponse: YamahaAPIResponse | null;
}

interface PlayableListCardProps {
  results: Song[];
}

const PlayableListCard: React.FC<PlayableListCardProps> = ({ results }) => {
    return (
         <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-400/50 rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-200">弾ける曲リスト 検索結果</h3>
            </div>
            
            <div className="flex-grow min-h-[200px]">
                {results.length > 0 ? (
                    <ul className="space-y-3">
                        {results.map((song, index) => (
                            <li key={index} className="flex items-center text-white animate-fade-in">
                                <MusicNoteIcon className="h-5 w-5 mr-3 text-cyan-400" />
                                <span><strong>{song.title}</strong> - {song.artist}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center space-x-4 h-full justify-center">
                        <XCircleIcon className="h-8 w-8 text-gray-500" />
                        <div>
                            <p className="text-lg font-semibold text-white">見つかりませんでした</p>
                            <p className="text-gray-400">リスト内に見つかりません。</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const YamahaCard: React.FC<{ 
    isLoading: boolean; 
    error: string | null; 
    response: YamahaAPIResponse | null;
    searchTerm: string;
}> = ({ isLoading, error, response, searchTerm }) => {
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-pink-300 mt-2">AIがヤマハ「プリント楽譜」を検索中...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center space-x-4 h-full justify-center text-red-300">
                    <XCircleIcon className="h-8 w-8" />
                    <div>
                        <p className="text-lg font-semibold">エラーが発生しました</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            );
        }

        if (!response) {
             const searchUrl = `https://www.print-gakufu.com/search/result/score___keyword__${encodeURIComponent(searchTerm)}___subscription/`;
             return (
                <div className="text-center">
                    <p className="text-gray-400 mb-6">
                        AIが「<span className="font-bold text-pink-300">{searchTerm}</span>」の楽譜を探します。<br/>(アプリ見放題プラン対象)
                    </p>
                    <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 transition-all duration-300 transform hover:scale-105"
                    >
                        <ExternalLinkIcon className="h-5 w-5" />
                        <span>公式サイトで直接探す</span>
                    </a>
                </div>
             )
        }
        
        const { result, details, sources } = response;
        
        let icon, title, titleColor;
        switch(result) {
            case YamahaCheckResult.Available:
                icon = <CheckCircleIcon className="h-10 w-10 text-green-400" />;
                title = "【対象】見つかりました";
                titleColor = "text-green-400";
                break;
            case YamahaCheckResult.NotAvailable:
                icon = <XCircleIcon className="h-10 w-10 text-red-400" />;
                title = "【対象外】見つかりませんでした";
                titleColor = "text-red-400";
                break;
            default:
                icon = <QuestionMarkCircleIcon className="h-10 w-10 text-yellow-400" />;
                title = "【不明】特定できませんでした";
                titleColor = "text-yellow-400";
        }
        
        const summary = details.split('♫')[0].trim();
        const songList = details.includes('♫') ? details.substring(details.indexOf('♫')).split('\n').filter(s => s.trim()) : [];

        return (
            <div className="text-left w-full animate-fade-in">
                <div className="flex items-center gap-4 mb-4">
                    {icon}
                    <h4 className={`text-2xl font-bold ${titleColor}`}>{title}</h4>
                </div>
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">{summary}</p>
                {songList.length > 0 && (
                    <div className="mb-4">
                        <h5 className="font-bold text-gray-200 mb-2">関連曲リスト:</h5>
                        <ul className="space-y-1 pl-2">
                            {songList.map((song, i) => (
                                <li key={i} className="text-sm text-pink-300">{song}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {sources && sources.length > 0 && (
                     <div>
                        <h5 className="font-bold text-gray-200 mb-2">参照元:</h5>
                        <ul className="space-y-1">
                            {sources.map((source, i) => (
                                <li key={i} className="text-sm">
                                    <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-cyan-400 hover:underline">
                                        <ExternalLinkIcon className="h-4 w-4" />
                                        <span className="truncate">{source.web?.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-pink-400/50 rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-200">ヤマハ「プリント楽譜」検索</h3>
            </div>
            <div className="flex-grow min-h-[200px] flex flex-col justify-center items-center">
                {renderContent()}
            </div>
        </div>
    );
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ error, playableListResult, hasSearched, searchTerm, isYamahaLoading, yamahaApiError, yamahaApiResponse }) => {
  if (!hasSearched) {
    return (
      <div className="text-center p-8 mt-8 bg-gray-800/30 rounded-2xl">
        <h2 className="text-2xl font-bold text-white">弾ける曲を検索しよう！</h2>
        <p className="text-gray-400 mt-2">上の検索ボックスに曲名やアーティスト名を入力して、リスト内と「ぷりんと楽譜」を同時に検索します。</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 mt-8 bg-red-900/50 rounded-2xl text-red-300">{error}</div>;
  }

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl animate-fade-in">
        <PlayableListCard 
            results={playableListResult}
        />
        <YamahaCard 
            isLoading={isYamahaLoading}
            error={yamahaApiError}
            response={yamahaApiResponse}
            searchTerm={searchTerm}
        />
    </div>
  );
};

export default ResultsDisplay;