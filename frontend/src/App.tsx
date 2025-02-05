import { useEffect, useRef, useCallback, useState } from 'react'
import { WikiCard } from './components/WikiCard'
import { useWikiArticles } from './hooks/useWikiArticles'
import { Loader2, Search } from 'lucide-react'
import { Analytics } from "@vercel/analytics/react"
import logo from './assets/ᜊ  ֙ 𝖠𝗌𝗍𝖺 — 🎴.jpeg'

function App() {
  const [showAbout, setShowAbout] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { 
    articles, 
    searchResults, 
    relatedArticles, 
    loading, 
    fetchArticles, 
    searchArticles, 
    fetchRelatedArticles 
  } = useWikiArticles()
  const observerTarget = useRef(null)
  const [showControls, setShowControls] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showRelated, setShowRelated] = useState(false);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && !loading) {
        fetchArticles()
      }
    },
    [loading, fetchArticles]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.5,
    })

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [handleObserver])

  useEffect(() => {
    fetchArticles()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setShowControls(currentScrollY < lastScrollY || currentScrollY < 100)
      setLastScrollY(currentScrollY)
    }

    const handleTouch = () => {
      setShowControls(true)
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('touchstart', handleTouch)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchstart', handleTouch)
    }
  }, [lastScrollY])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      searchArticles(searchTerm)
    }
  }

  const handleShowRelated = (pageId: number) => {
    fetchRelatedArticles(pageId);
    setShowRelated(true);
  };

  const displayArticles = searchTerm ? searchResults : articles

  return (
    <div className={`h-screen w-full bg-black text-white overflow-y-scroll snap-y snap-mandatory ${
      showRelated ? 'pb-72' : ''
    }`}>
      <div className={`fixed top-4 left-4 right-4 z-50 transition-transform duration-300 ${
        showControls ? 'translate-y-0' : '-translate-y-full sm:translate-y-0'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.location.reload()}
              className="text-2xl font-bold text-white drop-shadow-lg hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              <img src={logo} alt="WikiScroll Logo" className="h-8 w-8" />
              WikiScroll
            </button>
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="text-sm text-white/70 hover:text-white transition-colors sm:hidden"
            >
              About
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search articles..."
              className="px-3 py-1 rounded bg-gray-800 text-white w-full"
            />
            <button type="submit" className="p-2 rounded bg-gray-800 hover:bg-gray-700">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
        
        <button
          onClick={() => setShowAbout(!showAbout)}
          className="hidden sm:block absolute top-0 right-0 text-sm text-white/70 hover:text-white transition-colors"
        >
          About
        </button>
      </div>

      {showAbout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md relative">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">About WikiScroll</h2>
            <p className="mb-4">
              A TikTok-style interface for exploring random Wikipedia articles.
            </p>
            <p className="text-white/70">
              Made with ❤️ by{' '}
              <a
                href="https://www.linkedin.com/in/nigel-chimwene-911535202/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                Nigel
              </a>
            </p>
            
          </div>
        </div>
      )}

      {displayArticles.map((article) => (
        <WikiCard 
          key={article.pageid} 
          article={article} 
          onShowRelated={() => handleShowRelated(article.pageid)}
        />
      ))}

      {showRelated && relatedArticles.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm p-4 rounded-t-lg shadow-lg z-40">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">Related Articles</h3>
            <button
              onClick={() => setShowRelated(false)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {relatedArticles.map((article) => (
              <div key={article.pageid} className="flex-shrink-0 w-64">
                <WikiCard article={article} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={observerTarget} className="h-10" />
      {loading && (
        <div className="h-screen w-full flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      )}
      <Analytics />
    </div>
  )
}
export default App