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

export interface ArtistRankingItem {
  id: string; // artist name
  count: number;
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
  createdAt: number;
  imageUrl?: string;
  // This is a client-side only property for uploads
  imageBase64?: string;
  removeImage?: boolean;
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
    ofuseUrl?: string;
    doneruUrl?: string;
    amazonWishlistUrl?: string;
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