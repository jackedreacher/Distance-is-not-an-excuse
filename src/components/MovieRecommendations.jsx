import { useState, useEffect, useRef } from 'react'
import { 
  getCurrentMovies, 
  getCurrentTVShows, 
  getMovieDetails, 
  getTVShowDetails,
  TMDB_IMAGE_BASE_URL,
  formatDate,
  formatRuntime,
  getGenreNames
} from '../utils/movieUtils'

const PAGE_SIZE = 6
const MAX_ITEMS = 20

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
  const modalRef = useRef(null)

  useEffect(() => {
    loadContent()
    const interval = setInterval(() => {
      loadContent()
    }, 60 * 60 * 1000) // 1 saat
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedItem && modalRef.current) {
      // Scroll modal into view, center of the viewport
      setTimeout(() => {
        modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    }
  }, [selectedItem])

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

  // Pagination helpers
  const getPagedItems = (items, page) => {
    const start = (page - 1) * PAGE_SIZE
    return items.slice(start, start + PAGE_SIZE)
  }
  const totalMoviePages = Math.ceil(movies.length / PAGE_SIZE)
  const totalTVPages = Math.ceil(tvShows.length / PAGE_SIZE)

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
      onClick={() => handleItemClick(item, type)}
    >
      <div className="content-poster">
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
        <h3 className="content-title">
          {type === 'movie' ? item.title : item.name}
        </h3>
        <div className="content-meta">
          <span className="rating">⭐ {item.vote_average?.toFixed(1) || 'N/A'}</span>
          <span className="date">
            {formatDate(type === 'movie' ? item.release_date : item.first_air_date)}
          </span>
        </div>
        <p className="content-overview">
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
        <h2 className="recommendations-title">🎬 Birlikte İzleyebileceğiniz Öneriler</h2>
        <p className="recommendations-subtitle">Güncel film ve diziler</p>
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
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">🎬</div>
          <p>İçerikler yükleniyor...</p>
        </div>
      ) : (
        <>
          <div className="content-grid">
            {activeTab === 'movies' 
              ? getPagedItems(movies, moviePage).map(movie => renderItemCard(movie, 'movie'))
              : getPagedItems(tvShows, tvPage).map(show => renderItemCard(show, 'tv'))
            }
          </div>
          <div className="pagination">
            {activeTab === 'movies' ? (
              <>
                <button 
                  className="pagination-btn" 
                  onClick={() => setMoviePage(p => Math.max(1, p - 1))}
                  disabled={moviePage === 1}
                >Önceki</button>
                <span className="pagination-info">{moviePage} / {totalMoviePages}</span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setMoviePage(p => Math.min(totalMoviePages, p + 1))}
                  disabled={moviePage === totalMoviePages}
                >Sonraki</button>
              </>
            ) : (
              <>
                <button 
                  className="pagination-btn" 
                  onClick={() => setTVPage(p => Math.max(1, p - 1))}
                  disabled={tvPage === 1}
                >Önceki</button>
                <span className="pagination-info">{tvPage} / {totalTVPages}</span>
                <button 
                  className="pagination-btn" 
                  onClick={() => setTVPage(p => Math.min(totalTVPages, p + 1))}
                  disabled={tvPage === totalTVPages}
                >Sonraki</button>
              </>
            )}
          </div>
        </>
      )}

      {renderModal()}
    </div>
  )
}

export default MovieRecommendations 