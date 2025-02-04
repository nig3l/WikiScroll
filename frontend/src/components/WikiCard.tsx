import { Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WikiArticle {
    title: string;
    pageid: number;
    thumbnail?: {
        source: string;
        width: number;
        height: number;
    };
}

interface WikiCardProps {
    article: WikiArticle;
    onShowRelated?: () => void;
    compact?: boolean;
}

export function WikiCard({ article, onShowRelated, compact }: WikiCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [articleContent, setArticleContent] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticleContent = async () => {
            try {
                const response = await fetch(
                    `https://en.wikipedia.org/w/api.php?` +
                    `action=query&format=json&origin=*&prop=extracts&` +
                    `pageids=${article.pageid}&explaintext=1&exintro=1&` +
                    `exsentences=5`  // Limit to 5 sentences
                );
                const data = await response.json();
                const content = data.query.pages[article.pageid].extract;
                if (content) {
                    setArticleContent(content);
                }
            } catch (error) {
                console.error('Error fetching article content:', error);
            }
        };

        fetchArticleContent();
    }, [article.pageid]);

    // Add debugging log
    console.log('Article data:', {
        title: article.title,
        pageid: article.pageid
    });

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: articleContent || '',
                    url: `https://en.wikipedia.org/?curid=${article.pageid}`
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: Copy to clipboard
            const url = `https://en.wikipedia.org/?curid=${article.pageid}`;
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className={`relative ${compact ? 'h-48' : 'h-screen'} snap-start`}>
            <div className="h-full w-full relative">
                {article.thumbnail ? (
                    <div className="absolute inset-0">
                        <img
                            loading="lazy"
                            src={article.thumbnail.source}
                            alt={article.title}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                                console.error('Image failed to load:', e);
                                setImageLoaded(true); // Show content even if image fails
                            }}
                        />
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-gray-900 animate-pulse" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gray-900" />
                )}
                {/* Content container with z-index to ensure it's above the image */}
                <div className="absolute bottom-[10vh] left-0 right-0 p-6 text-white z-10">
                    <div className="flex justify-between items-start mb-3">
                        <a
                            href={`https://en.wikipedia.org/?curid=${article.pageid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-gray-200 transition-colors"
                        >
                            <h2 className="text-2xl font-bold drop-shadow-lg">{article.title}</h2>
                        </a>
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                            aria-label="Share article"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                    {articleContent ? (
                        <p className="text-gray-100 mb-4 drop-shadow-lg">{articleContent}</p>
                    ) : (
                        <p className="text-gray-100 mb-4 drop-shadow-lg italic">Loading description...</p>
                    )}
                    <a
                        href={`https://en.wikipedia.org/?curid=${article.pageid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-white hover:text-gray-200 drop-shadow-lg"
                    >
                        Read more →
                    </a>
                </div>
            </div>
            {onShowRelated && (
                <button
                    onClick={onShowRelated}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20"
                >
                    Show Related
                </button>
            )}
        </div>
    );
}