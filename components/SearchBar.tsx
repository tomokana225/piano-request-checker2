
import React from 'react';
import { SearchIcon } from './IconComponents.tsx';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, handleSearch, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="曲名やアーティスト名で検索..."
        disabled={isLoading}
        className="w-full pl-5 pr-28 py-4 text-lg bg-gray-700/50 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-300 shadow-lg"
      />
      <button
        onClick={handleSearch}
        disabled={isLoading}
        className="absolute inset-y-0 right-2 my-2 flex items-center px-6 bg-pink-600 text-white rounded-full hover:bg-pink-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-300"
      >
        <SearchIcon className="h-6 w-6 mr-2" />
        <span className="font-bold">検索</span>
      </button>
    </div>
  );
};

export default SearchBar;