// --- TYPE DEFINITIONS ---
export interface Song {
  title: string;
  artist: string;
  genre: string;
  isNew: boolean;
  status: 'playable' | 'practicing';
}

export interface SearchResult {
  status: 'found' | 'related' | 'notFound';
  songs: Song[];
  searchTerm: string;
}

export interface RankingItem {
  id: string; // song title
  count: number;
  artist: string;
}

export interface RequestRankingItem {
    id: string; // requested song title
    count: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: { _seconds: number, _nanoseconds: number };
  imageUrl?: string;
}

export interface NavButtonConfig {
    label: string;
    enabled: boolean;
}

export interface UiConfig {
    mainTitle: string;
    subtitle: string;
    primaryColor: string;
    twitcastingUrl?: string;
    navButtons: {
        search: NavButtonConfig;
        list: NavButtonConfig;
        ranking: NavButtonConfig;
        requests: NavButtonConfig;
        blog: NavButtonConfig;
        suggest: NavButtonConfig;
    }
}

export type Mode = 'search' | 'list' | 'ranking' | 'requests' | 'blog';