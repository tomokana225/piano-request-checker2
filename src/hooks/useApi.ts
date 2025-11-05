import { useState, useEffect, useCallback } from 'react';
import { Song, RankingItem, RequestRankingItem, BlogPost, UiConfig } from '../types';
import { parseSongs } from '../utils/parser';

const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'ともかなのリクエスト曲ー検索',
    subtitle: '弾ける曲 or ぷりんと楽譜にある曲かチェックできます',
    primaryColor: '#ec4899',
    twitcastingUrl: 'https://twitcasting.tv/g:101738740616323847745',
    navButtons: {
        search: { label: '曲を検索', enabled: true },
        list: { label: '曲リスト', enabled: true },
        ranking: { label: '人気曲', enabled: true },
        requests: { label: 'リクエスト', enabled: true },
        blog: { label: 'ブログ', enabled: true },
        suggest: { label: 'おまかせ選曲', enabled: true },
    }
};

const API_BASE_URL = '/api';

export const useApi = () => {
    const [rawSongList, setRawSongList] = useState('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [adminBlogPosts, setAdminBlogPosts] = useState<BlogPost[]>([]);
    const [uiConfig, setUiConfig] = useState<UiConfig>(DEFAULT_UI_CONFIG);
    const [rankingList, setRankingList] = useState<RankingItem[]>([]);
    const [requestRankingList, setRequestRankingList] = useState<RequestRankingItem[]>([]);
    const [rankings, setRankings] = useState<Record<string, number>>({});
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
    const [isLoading, setIsLoading] = useState(true);

    const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            setConnectionStatus('offline');
            throw error;
        }
    }, []);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        setConnectionStatus('connecting');
        try {
            const [songsData, configData, blogData, rankingData, requestRankingData] = await Promise.all([
                apiRequest('songs'),
                apiRequest('songs?action=getUiConfig'),
                apiRequest('songs?action=getBlogPosts'),
                apiRequest('get-ranking'),
                apiRequest('get-request-ranking'),
            ]);
            
            setRawSongList(songsData.list);
            const parsedSongs = parseSongs(songsData.list);
            setSongs(parsedSongs);
            setUiConfig(configData);
            setBlogPosts(blogData);
            setRankingList(rankingData);
            setRequestRankingList(requestRankingData);

            const rankingMap = rankingData.reduce((acc: Record<string, number>, item: RankingItem, index: number) => {
                acc[item.id] = index + 1;
                return acc;
            }, {});
            setRankings(rankingMap);
            
            setConnectionStatus('connected');
        } catch (error) {
            // Error is handled in apiRequest
        } finally {
            setIsLoading(false);
        }
    }, [apiRequest]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSaveSongs = useCallback(async (newSongList: string) => {
        try {
            await apiRequest('songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ list: newSongList }),
            });
            setRawSongList(newSongList);
            setSongs(parseSongs(newSongList));
            return true;
        } catch (error) {
            return false;
        }
    }, [apiRequest]);
    
    const fetchAdminBlogPosts = useCallback(async () => {
        try {
            const data = await apiRequest('songs?action=getAdminBlogPosts');
            setAdminBlogPosts(data);
        } catch (error) {
            // error handled in apiRequest
        }
    }, [apiRequest]);

    const refetchBlogData = useCallback(async () => {
        try {
            const [adminData, publicData] = await Promise.all([
                apiRequest('songs?action=getAdminBlogPosts'),
                apiRequest('songs?action=getBlogPosts')
            ]);
            setAdminBlogPosts(adminData);
            setBlogPosts(publicData);
        } catch (error) {
            console.error("Failed to refetch blog data", error);
        }
    }, [apiRequest]);

    const handleSavePost = useCallback(async (post: Omit<BlogPost, 'createdAt'>) => {
        try {
            await apiRequest('songs?action=saveBlogPost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post),
            });
            await refetchBlogData();
            return true;
        } catch (error) {
            return false;
        }
    }, [apiRequest, refetchBlogData]);

    const handleDeletePost = useCallback(async (id: string) => {
        try {
            await apiRequest('songs?action=deleteBlogPost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            await refetchBlogData();
            return true;
        } catch (error) {
            return false;
        }
    }, [apiRequest, refetchBlogData]);

    const handleSaveUiConfig = useCallback(async (config: UiConfig) => {
        try {
            await apiRequest('songs?action=saveUiConfig', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            setUiConfig(config);
            return true;
        } catch (error) {
            return false;
        }
    }, [apiRequest]);
    
    const logSearchTerm = useCallback((term: string) => {
      if(!term) return;
      apiRequest('log-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term })
      }).catch(() => {}); // fire and forget
    }, [apiRequest]);
    
    const logRequest = useCallback((term: string) => {
      if(!term) return;
      apiRequest('log-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term })
      }).catch(() => {}); // fire and forget
    }, [apiRequest]);

    const fetchRankings = useCallback(async () => {
        try {
            const rankingData = await apiRequest('get-ranking');
            setRankingList(rankingData);
             const rankingMap = rankingData.reduce((acc: Record<string, number>, item: RankingItem, index: number) => {
                acc[item.id] = index + 1;
                return acc;
            }, {});
            setRankings(rankingMap);
        } catch (error) {
            // error handled in apiRequest
        }
    }, [apiRequest]);

    const fetchRequestRankings = useCallback(async () => {
        try {
            const requestRankingData = await apiRequest('get-request-ranking');
            setRequestRankingList(requestRankingData);
        } catch (error) {
            // error handled in apiRequest
        }
    }, [apiRequest]);


    return {
        songs,
        rawSongList,
        blogPosts,
        adminBlogPosts,
        uiConfig,
        rankingList,
        requestRankingList,
        rankings,
        connectionStatus,
        isLoading,
        handleSaveSongs,
        handleSavePost,
        handleDeletePost,
        handleSaveUiConfig,
        logSearchTerm,
        logRequest,
        fetchAdminBlogPosts,
        fetchRankings,
        fetchRequestRankings,
    };
};