import { Song } from '../types';

export const parseSongs = (str: string): Song[] => {
    if (!str) return [];
    return str.replace(/\r\n/g, '\n').split('\n').map(line => {
        if (!line.trim()) return null;
        const parts = line.split(',');
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        return {
            title: parts[0].trim(),
            artist: parts[1].trim(),
            genre: parts[2]?.trim() || '',
            isNew: parts[3]?.trim()?.toLowerCase() === 'new',
            status: parts[4]?.trim()?.toLowerCase() === '練習中' ? 'practicing' : 'playable',
        };
    }).filter((song): song is Song => song !== null);
};
