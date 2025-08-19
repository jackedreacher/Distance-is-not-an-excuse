import { useState, useEffect, useRef } from 'react'
import { 
  getCurrentMovies, 
  getCurrentTVShows, 
  getMovieDetails, 
  getTVShowDetails,
  TMDB_IMAGE_BASE_URL,
  formatDate,
  formatRuntime,
  getGenreNames,
  fetchMovieGenres,
  fetchTVGenres,
  searchContent
} from '../utils/movieUtils'
import { movieLikesService } from '../services/api'

const PAGE_SIZE = 6
const MAX_ITEMS = 1000 // Daha fazla içerik (1000 film ve 1000 dizi)

const MovieRecommendations = () => {
  const [movies, setMovies] = useState([])
  const [tvShows, setTVShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeTab, setActiveTab] = useState('movies')
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [isModalClosing, setIsModalClosing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [moviePage, setMoviePage] = useState(1)
  const [tvPage, setTVPage] = useState(1)
  const [watchlistPage, setWatchlistPage] = useState(1)
  const [movieGenres, setMovieGenres] = useState([])
  const [tvGenres, setTVGenres] = useState([])
  const [selectedMovieGenre, setSelectedMovieGenre] = useState('')
  const [selectedTVGenre, setSelectedTVGenre] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [likedItems, setLikedItems] = useState([])
  const modalRef = useRef(null)
  // Global search mode state
  const [searchMode, setSearchMode] = useState('local') // 'local' | 'global'
  const [globalResults, setGlobalResults] = useState({ movies: [], tvShows: [] })
  const [isGlobalSearching, setIsGlobalSearching] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    loadContent()
    fetchGenres()
    loadLikedItems()
    
    const interval = setInterval(() => {
      loadContent()
    }, 60 * 60 * 1000) // 1 saat
    return () => clearInterval(interval)
  }, [])

  // Debug likedItems state changes
  useEffect(() => {
    console.log('🎯 likedItems state changed:', likedItems.length, 'items')
    console.log('📋 Current likedItems:', likedItems)
  }, [likedItems])

  useEffect(() => {
    if (selectedItem && modalRef.current) {
      // Scroll modal into view, center of the viewport
      setTimeout(() => {
        modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }, [selectedItem])

  // Global TMDB search (debounced)
  useEffect(() => {
    if (searchMode !== 'global') return
    if (!searchQuery || searchQuery.trim().length < 2) {
      setGlobalResults({ movies: [], tvShows: [] })
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsGlobalSearching(true)
      try {
        const results = await searchContent(searchQuery)
        setGlobalResults(results)
      } catch (e) {
        console.error('Global search error:', e)
      } finally {
        setIsGlobalSearching(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, searchMode])
  
  const fetchGenres = async () => {
    const [movieGenresData, tvGenresData] = await Promise.all([
      fetchMovieGenres(),
      fetchTVGenres()
    ])
    setMovieGenres(movieGenresData)
    setTVGenres(tvGenresData)
  }

  const loadContent = async () => {
    setLoading(true)
    try {
      const [moviesData, tvShowsData] = await Promise.all([
        getCurrentMovies(MAX_ITEMS),
        getCurrentTVShows(MAX_ITEMS)
      ])
      
      // Check if we're using mock data (if movies length is exactly 10, it's likely mock data)
      if (moviesData.length === 10 && moviesData[0]?.title === "Barbie") {
        setIsUsingMockData(true)
      } else {
        setIsUsingMockData(false)
      }
      
      setMovies(moviesData)
      setTVShows(tvShowsData)
      setLastUpdated(new Date())
      setMoviePage(1)
      setTVPage(1)
    } catch (error) {
      console.error('Error loading content:', error)
      setIsUsingMockData(true)
    }
    setLoading(false)
  }

  const loadLikedItems = async () => {
    try {
      console.log('🔄 Loading liked items...')
      
      // Use direct fetch to bypass any service issues
      const response = await fetch('http://localhost:5001/api/movie-likes')
      const data = await response.json()
      console.log('📡 API response:', data)
      console.log('📊 Response type:', typeof data, 'Is array:', Array.isArray(data))
      
      if (Array.isArray(data)) {
        console.log('✅ Setting state with', data.length, 'items')
        // Convert database items to the format expected by the component
        const formattedLikes = data.map(item => ({
          id: item.movieId,
          type: item.type,
          title: item.title,
          poster_path: item.posterPath,
          overview: item.overview,
          release_date: item.releaseDate,
          vote_average: item.voteAverage,
          genre_ids: item.genres,
          original_title: item.originalTitle,
          original_language: item.originalLanguage
        }))
        console.log('🎬 Formatted likes:', formattedLikes)
        setLikedItems(formattedLikes)
        console.log('✅ State set with', formattedLikes.length, 'items')
      } else {
        console.log('❌ No data received or not an array')
        setLikedItems([])
      }
    } catch (error) {
      console.error('💥 Error loading liked items:', error)
      setLikedItems([])
    }
  }

  // Pagination helpers
  const getPagedItems = (items, page) => {
    const start = (page - 1) * PAGE_SIZE
    return items.slice(start, start + PAGE_SIZE)
  }

  // Like system
  const toggleLike = async (item, type) => {
    console.log('toggleLike called with:', { item, type })
    console.log('Current likedItems:', likedItems)
    const itemWithType = { ...item, type }
    const isLiked = likedItems.some(liked => liked.id === item.id && liked.type === type)
    console.log('isLiked:', isLiked)
    
    try {
      if (isLiked) {
        // Unlike: remove from database and local state
        console.log('Unliking item...')
        const response = await movieLikesService.unlike(item.id, type)
        console.log('Unlike response:', response)
        setLikedItems(prev => prev.filter(liked => !(liked.id === item.id && liked.type === type)))
      } else {
        // Like: add to database and local state
        const movieData = {
          gender: 'male', // Default gender value
          movieId: item.id,
          title: item.title || item.name,
          type: type,
          posterPath: item.poster_path,
          overview: item.overview,
          releaseDate: item.release_date || item.first_air_date,
          voteAverage: item.vote_average,
          genres: [], // Empty array for now, can be populated later
          originalTitle: item.original_title || item.original_name,
          originalLanguage: item.original_language
        }
        
        console.log('Adding movie data:', movieData)
        const response = await movieLikesService.add(movieData)
        console.log('Add response:', response)
        setLikedItems(prev => [...prev, itemWithType])
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Optionally show user feedback here
    }
  }

  const isItemLiked = (item, type) => {
    const result = likedItems.some(liked => liked.id === item.id && liked.type === type)
    console.log(`isItemLiked check for ${item.title || item.name} (${item.id}, ${type}):`, result, 'likedItems:', likedItems)
    return result
  }

  // Search and filter functions
  const searchItems = (items, query) => {
    if (!query) return items
    return items.filter(item => {
      const title = item.title || item.name || ''
      const overview = item.overview || ''
      return title.toLowerCase().includes(query.toLowerCase()) ||
             overview.toLowerCase().includes(query.toLowerCase())
    })
  }

  // Genre filtering
  const filterByGenre = (items, selectedGenre) => {
    if (!selectedGenre) return items
    return items.filter(item => {
      // TMDB API: genre_ids is array of ids, genres is array of {id, name}
      if (item.genre_ids && Array.isArray(item.genre_ids)) {
        return item.genre_ids.includes(Number(selectedGenre))
      }
      if (item.genres && Array.isArray(item.genres)) {
        return item.genres.some(g => g.id === Number(selectedGenre) || g.name === selectedGenre)
      }
      return false
    })
  }

  // Combined filtering
  const getFilteredItems = (items, genre, query) => {
    let filtered = filterByGenre(items, genre)
    filtered = searchItems(filtered, query)
    return filtered
  }

  // Helper to compute active items based on search mode and tab
  const getActiveItemsFor = (tab) => {
    if (tab === 'watchlist') {
      return searchItems(likedItems, searchQuery)
    }
    const isMovies = tab === 'movies'
    if (searchMode === 'global' && searchQuery.trim().length >= 2) {
      const base = isMovies ? globalResults.movies : globalResults.tvShows
      return filterByGenre(base, isMovies ? selectedMovieGenre : selectedTVGenre)
    } else {
      const base = isMovies ? movies : tvShows
      return getFilteredItems(base, isMovies ? selectedMovieGenre : selectedTVGenre, searchQuery)
    }
  }

  const handleItemClick = async (item, type) => {
    setLoading(true)
    try {
      let details
      if (type === 'movie') {
        details = await getMovieDetails(item.id)
      } else {
        details = await getTVShowDetails(item.id)
      }
      setSelectedItem({ ...details, type })
    } catch (error) {
      console.error('Error loading details:', error)
    }
    setLoading(false)
  }

  const closeModal = () => {
    setIsModalClosing(true)
    setTimeout(() => {
      setSelectedItem(null)
      setIsModalClosing(false)
    }, 300)
  }

  const renderItemCard = (item, type) => (
    <div 
      key={item.id} 
      className="content-card"
    >
      <div className="content-poster" onClick={() => handleItemClick(item, type)}>
        {item.poster_path ? (
          <img 
            src={item.poster_path.startsWith('http') ? item.poster_path : `${TMDB_IMAGE_BASE_URL}${item.poster_path}`}
            alt={type === 'movie' ? item.title : item.name}
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div className="no-poster" style={{ display: item.poster_path ? 'none' : 'flex' }}>
          <div className="poster-placeholder">
            <span className="movie-icon">🎬</span>
            <h3 className="placeholder-title">{type === 'movie' ? item.title : item.name}</h3>
            <div className="placeholder-meta">
              <span className="rating">⭐ {item.vote_average?.toFixed(1) || 'N/A'}</span>
              <span className="date">
                {formatDate(type === 'movie' ? item.release_date : item.first_air_date)}
              </span>
            </div>
          </div>
        </div>
        <div className="content-overlay">
          <span className="view-details">Detayları Gör</span>
        </div>
      </div>
      <div className="content-info">
        <div className="content-header">
          <h3 className="content-title" onClick={() => handleItemClick(item, type)}>
            {type === 'movie' ? item.title : item.name}
          </h3>
          <button 
            className={`like-btn ${isItemLiked(item, type) ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              toggleLike(item, type)
            }}
            title={isItemLiked(item, type) ? 'İzleneceklerden çıkar' : 'İzleneceklere ekle'}
          >
            {isItemLiked(item, type) ? '❤️' : '🤍'}
          </button>
        </div>
        <div className="content-meta">
          <span className="rating">⭐ {item.vote_average?.toFixed(1) || 'N/A'}</span>
          <span className="date">
            {formatDate(type === 'movie' ? item.release_date : item.first_air_date)}
          </span>
        </div>
        <p className="content-overview" onClick={() => handleItemClick(item, type)}>
          {item.overview?.length > 100 
            ? `${item.overview.substring(0, 100)}...` 
            : item.overview || 'Özet bilgisi yok'}
        </p>
      </div>
    </div>
  )

  const renderModal = () => {
    if (!selectedItem) return null

    const item = selectedItem
    const isMovie = item.type === 'movie'

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div ref={modalRef} className={`modal-content ${isModalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>×</button>
          
          <div className="modal-header">
            {item.backdrop_path && (
              <div 
                className="modal-backdrop"
                style={{
                  backgroundImage: `url(${TMDB_IMAGE_BASE_URL}${item.backdrop_path})`
                }}
              />
            )}
            <div className="modal-poster">
              {item.poster_path ? (
                <img 
                  src={`${TMDB_IMAGE_BASE_URL}${item.poster_path}`} 
                  alt={isMovie ? item.title : item.name}
                />
              ) : (
                <div className="no-poster-modal">
                  <span>🎬</span>
                </div>
              )}
            </div>
            <div className="modal-title-section">
              <h2>{isMovie ? item.title : item.name}</h2>
              <p className="original-title">
                {isMovie ? item.original_title : item.original_name}
              </p>
              <div className="modal-meta">
                <span className="rating">⭐ {item.vote_average?.toFixed(1) || 'N/A'}</span>
                <span className="date">
                  {formatDate(isMovie ? item.release_date : item.first_air_date)}
                </span>
                {isMovie && item.runtime && (
                  <span className="runtime">{formatRuntime(item.runtime)}</span>
                )}
                {!isMovie && item.number_of_seasons && (
                  <span className="seasons">{item.number_of_seasons} Sezon</span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-section">
              <h3>📖 Özet</h3>
              <p>{item.overview || 'Özet bilgisi yok'}</p>
            </div>

            <div className="modal-section">
              <h3>🎭 Tür</h3>
              <div className="genres">
                {getGenreNames(item.genres).map((genre, index) => (
                  <span key={index} className="genre-tag">{genre}</span>
                ))}
              </div>
            </div>

            <div className="modal-section">
              <h3>🎬 {isMovie ? 'Yönetmen' : 'Yaratıcı'}</h3>
              <p>{isMovie ? item.director : item.creator}</p>
            </div>

            {item.cast && item.cast.length > 0 && (
              <div className="modal-section">
                <h3>👥 Oyuncular</h3>
                <div className="cast-list">
                  {item.cast.map((actor, index) => (
                    <span key={index} className="cast-member">
                      {actor.name}
                      {index < item.cast.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {item.production_companies && item.production_companies.length > 0 && (
              <div className="modal-section">
                <h3>🏢 Yapım Şirketi</h3>
                <div className="companies">
                  {item.production_companies.map((company, index) => (
                    <span key={index} className="company">
                      {company.name}
                      {index < item.production_companies.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="movie-recommendations">
      <div className="recommendations-header">
       
        {isUsingMockData ? (
          <div className="api-notice">
            <p>📡 API bağlantısı kurulamadı, örnek veriler gösteriliyor</p>
            <p className="api-note">Gerçek zamanlı veriler için geçerli API anahtarı gerekli</p>
          </div>
        ) : (
          <div className="api-success">
            <p>✅ Gerçek zamanlı veriler yükleniyor</p>
            <p className="api-note">Güncel film ve dizi bilgileri TMDB'den alınıyor</p>
          </div>
        )}
        <div className="last-updated">
          <span>Son güncellenme: {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder={searchMode === 'global' ? 'TMDB Global Arama: Film veya dizi ara...' : 'Film veya dizi ara...'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setMoviePage(1)
            setTVPage(1)
            setWatchlistPage(1)
          }}
        />
        <span className="search-icon">{isGlobalSearching ? '🔄' : '🔍'}</span>
        <div className="search-mode-toggle" style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
          <button 
            className={`mode-btn ${searchMode === 'local' ? 'active' : ''}`}
            onClick={() => {
              setSearchMode('local')
              setMoviePage(1); setTVPage(1); setWatchlistPage(1)
            }}
          >Yerel</button>
          <button 
            className={`mode-btn ${searchMode === 'global' ? 'active' : ''}`}
            onClick={() => {
              setSearchMode('global')
              setMoviePage(1); setTVPage(1)
            }}
          >Global (TMDB)</button>
        </div>
      </div>

      {searchMode === 'global' && searchQuery.trim().length >= 2 && (globalResults.movies.length > 0 || globalResults.tvShows.length > 0) && (
        <div className="global-suggestions" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 12, margin: '8px 0' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 240, flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Filmler</h4>
              {globalResults.movies.slice(0, 5).map(m => (
                <div key={`gm-${m.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }} onClick={() => handleItemClick(m, 'movie')}>
                  {m.poster_path && (<img src={`${TMDB_IMAGE_BASE_URL}${m.poster_path}`} alt={m.title} style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4 }} />)}
                  <span>{m.title} {m.release_date ? `(${new Date(m.release_date).getFullYear()})` : ''}</span>
                </div>
              ))}
              {globalResults.movies.length === 0 && <div style={{ opacity: 0.7 }}>Sonuç yok</div>}
            </div>
            <div style={{ minWidth: 240, flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Diziler</h4>
              {globalResults.tvShows.slice(0, 5).map(t => (
                <div key={`gt-${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }} onClick={() => handleItemClick(t, 'tv')}>
                  {t.poster_path && (<img src={`${TMDB_IMAGE_BASE_URL}${t.poster_path}`} alt={t.name} style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4 }} />)}
                  <span>{t.name} {t.first_air_date ? `(${new Date(t.first_air_date).getFullYear()})` : ''}</span>
                </div>
              ))}
              {globalResults.tvShows.length === 0 && <div style={{ opacity: 0.7 }}>Sonuç yok</div>}
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>Not: Tüm sonuçlar aşağıdaki listede görüntülenir ve sayfalanır.</div>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          🎭 Filmler
        </button>
        <button 
          className={`tab ${activeTab === 'tv' ? 'active' : ''}`}
          onClick={() => setActiveTab('tv')}
        >
          📺 Diziler
        </button>
        <button 
          className={`tab ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('watchlist')
            console.log('🎯 Watchlist clicked. likedItems length:', likedItems.length)
            console.log('🎯 Current likedItems:', likedItems)
          }}
        >
          ❤️ İzlenecekler ({likedItems.length})
        </button>
      </div>

      {/* Genre filter dropdowns */}
      {activeTab !== 'watchlist' && (
        <div className="genre-filter-row">
          {activeTab === 'movies' ? (
            <select
              className="genre-dropdown"
              value={selectedMovieGenre}
              onChange={e => {
                setSelectedMovieGenre(e.target.value)
                setMoviePage(1)
              }}
            >
              <option value="">Tüm Türler</option>
              {movieGenres.map(genre => (
                <option key={genre.id} value={genre.id}>{genre.name}</option>
              ))}
            </select>
          ) : (
            <select
              className="genre-dropdown"
              value={selectedTVGenre}
              onChange={e => {
                setSelectedTVGenre(e.target.value)
                setTVPage(1)
              }}
            >
              <option value="">Tüm Türler</option>
              {tvGenres.map(genre => (
                <option key={genre.id} value={genre.id}>{genre.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">🎬</div>
          <p>İçerikler yükleniyor...</p>
        </div>
      ) : (
        <>
          <div className="content-grid">
            {activeTab === 'movies' 
              ? getPagedItems(getActiveItemsFor('movies'), moviePage).map(movie => renderItemCard(movie, 'movie'))
              : activeTab === 'tv'
              ? getPagedItems(getActiveItemsFor('tv'), tvPage).map(show => renderItemCard(show, 'tv'))
              : getPagedItems(searchItems(likedItems, searchQuery), watchlistPage).map(item => renderItemCard(item, item.type))
            }
          </div>
          
          {activeTab === 'watchlist' && likedItems.length === 0 && (
            <div className="empty-watchlist">
              <div className="empty-icon">❤️</div>
              <h3>İzlenecekler listeniz boş</h3>
              <p>Beğendiğiniz film ve dizileri kalp butonuna tıklayarak buraya ekleyebilirsiniz.</p>
            </div>
          )}
          
          <div className="pagination">
            {activeTab === 'movies' ? (
              <>
                <button 
                  className="pagination-btn" 
                  onClick={() => setMoviePage(p => Math.max(1, p - 1))}
                  disabled={moviePage === 1}
                >Önceki</button>
                <span className="pagination-info">{moviePage} / {Math.ceil(getActiveItemsFor('movies').length / PAGE_SIZE) || 1}</span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setMoviePage(p => Math.min(Math.ceil(getActiveItemsFor('movies').length / PAGE_SIZE), p + 1))}
                  disabled={moviePage === Math.ceil(getActiveItemsFor('movies').length / PAGE_SIZE)}
                >Sonraki</button>
              </>
            ) : activeTab === 'tv' ? (
              <>
                <button 
                  className="pagination-btn" 
                  onClick={() => setTVPage(p => Math.max(1, p - 1))}
                  disabled={tvPage === 1}
                >Önceki</button>
                <span className="pagination-info">{tvPage} / {Math.ceil(getActiveItemsFor('tv').length / PAGE_SIZE) || 1}</span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setTVPage(p => Math.min(Math.ceil(getActiveItemsFor('tv').length / PAGE_SIZE), p + 1))}
                  disabled={tvPage === Math.ceil(getActiveItemsFor('tv').length / PAGE_SIZE)}
                >Sonraki</button>
              </>
            ) : likedItems.length > 0 ? (
              <>
                <button 
                  className="pagination-btn" 
                  onClick={() => setWatchlistPage(p => Math.max(1, p - 1))}
                  disabled={watchlistPage === 1}
                >Önceki</button>
                <span className="pagination-info">{watchlistPage} / {Math.ceil(searchItems(likedItems, searchQuery).length / PAGE_SIZE) || 1}</span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setWatchlistPage(p => Math.min(Math.ceil(searchItems(likedItems, searchQuery).length / PAGE_SIZE), p + 1))}
                  disabled={watchlistPage === Math.ceil(searchItems(likedItems, searchQuery).length / PAGE_SIZE)}
                >Sonraki</button>
              </>
            ) : null}
          </div>
        </>
      )}

      {renderModal()}
    </div>
  )
}

export default MovieRecommendations