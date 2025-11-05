import React from 'react';
import { BlogPost } from '../types';
import { SimpleMarkdownRenderer } from '../components/ui/SimpleMarkdownRenderer';

interface BlogViewProps {
    posts: BlogPost[];
}

const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};


export const BlogView: React.FC<BlogViewProps> = ({ posts }) => {
    return (
        <div className="w-full max-w-3xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-8">ブログ</h2>
            {posts && posts.length > 0 ? (
                <div className="space-y-8">
                    {posts.map(post => (
                        <article key={post.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            {post.imageUrl && (
                                <img 
                                    src={post.imageUrl} 
                                    alt={post.title} 
                                    className="w-full h-auto max-h-80 object-cover" 
                                />
                            )}
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-white mb-2">{post.title}</h3>
                                <p className="text-sm text-gray-400 mb-4">{formatDate(post.createdAt)}</p>
                                <SimpleMarkdownRenderer content={post.content} />
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-400 mt-8">まだお知らせはありません。</p>
            )}
        </div>
    );
};