import React, { useState, useEffect } from 'react';
import { BlogPost } from '../../types';
import { PlusIcon, XIcon } from '../../components/ui/Icons';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface BlogTabProps {
    posts: BlogPost[];
    onSavePost: (post: Omit<BlogPost, 'createdAt'>) => Promise<boolean>;
    onDeletePost: (id: string) => Promise<boolean>;
}

const formatDate = (timestamp: any) => {
    if (!timestamp?._seconds) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleString('ja-JP');
};

const BlogEditor: React.FC<{ 
    post: Partial<BlogPost> | null; 
    onSave: (post: any) => Promise<void>; 
    onCancel: () => void; 
}> = ({ post, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setTitle(post?.title || '');
        setContent(post?.content || '');
        setIsPublished(post?.isPublished || false);
        setCurrentImageUrl(post?.imageUrl || null);
        setImageBase64(null);
        setRemoveImage(false);
    }, [post]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit
                alert("画像サイズは1MB以下にしてください。");
                e.target.value = ''; // Reset file input
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImageBase64(result);
                setCurrentImageUrl(result);
                setRemoveImage(false);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveImage = () => {
        setCurrentImageUrl(null);
        setImageBase64(null);
        setRemoveImage(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const payload: any = { ...post, title, content, isPublished };
        if (imageBase64) {
            payload.imageBase64 = imageBase64;
        }
        if (removeImage) {
            payload.removeImage = true;
        }
        await onSave(payload);
        setIsSaving(false);
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <h4 className="text-md font-semibold mb-2">{post?.id ? '記事を編集' : '新しい記事を作成'}</h4>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="タイトル" className="w-full bg-gray-700 p-2 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="本文 (シンプルなMarkdownが使えます)" rows={10} className="w-full bg-gray-700 p-2 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] custom-scrollbar"></textarea>
            
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300">アイキャッチ画像</label>
                {currentImageUrl && (
                    <div className="mt-2 relative w-fit">
                        <img src={currentImageUrl} alt="Preview" className="max-h-40 rounded-md" />
                        <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5 hover:bg-opacity-80 transition-opacity">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="mt-2">
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/gif" 
                        onChange={handleFileChange} 
                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-cyan-300 hover:file:bg-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (1MBまで)</p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="form-checkbox h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" />
                    公開する
                </label>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-md">キャンセル</button>
                    <button onClick={handleSave} disabled={isSaving || !title} className="text-sm bg-cyan-600 hover:bg-cyan-700 px-3 py-1 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving ? <LoadingSpinner className="w-4 h-4" /> : null}
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export const BlogTab: React.FC<BlogTabProps> = ({ posts, onSavePost, onDeletePost }) => {
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

    const handleSave = async (post: Omit<BlogPost, 'createdAt'>) => {
        await onSavePost(post);
        setEditingPost(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('本当にこの記事を削除しますか？')) {
            await onDeletePost(id);
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">ブログ記事管理</h3>
                <button onClick={() => setEditingPost({})} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    新規作成
                </button>
            </div>

            {editingPost && <BlogEditor post={editingPost} onSave={handleSave} onCancel={() => setEditingPost(null)} />}

            <div className="mt-6 space-y-2">
                {posts.map(post => (
                    <div key={post.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {post.imageUrl && <img src={post.imageUrl} alt="" className="w-16 h-10 object-cover rounded-sm" />}
                            <div>
                                <p className="font-bold">{post.title} <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${post.isPublished ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>{post.isPublished ? '公開中' : '下書き'}</span></p>
                                <p className="text-xs text-gray-400">最終更新: {formatDate(post.createdAt)}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditingPost(post)} className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md">編集</button>
                            <button onClick={() => handleDelete(post.id)} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md">削除</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};