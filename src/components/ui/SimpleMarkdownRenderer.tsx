import React, { useMemo } from 'react';

export const SimpleMarkdownRenderer: React.FC<{ content: string }> = React.memo(({ content }) => {
    const renderContent = useMemo(() => {
        if (!content) return null;
        const blocks = content.split('\n\n');
        return blocks.map((block, index) => {
            const lines = block.split('\n').map(line =>
                line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">$1</a>')
            );
            return <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: lines.join('<br />') }} />;
        });
    }, [content]);

    return <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{renderContent}</div>;
});
