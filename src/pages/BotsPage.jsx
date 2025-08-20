import { useState } from 'react'
import './BotsPage.css'
import MusicPlayer from '../components/MusicPlayer'
import MovieRecommendations from '../components/MovieRecommendations'
import CloseButton from '../components/shared/CloseButton'
import { API_BASE_URL } from '../services/api'

const BotsPage = () => {
  const buttons = [
    { key: 'music', label: 'Music Çalar', color: 'green' },
    { key: 'video', label: 'Video oynatıcı', color: 'green' },
    { key: 'movie', label: 'Film Seçici', color: 'green' },
    { key: 'chat', label: 'Mesajlaşma', color: 'red' },
    
    { key: 'wishes', label: 'Dilekler', color: 'red' },
  ]

  // Sürükle-bırak durumları
  const [dragItem, setDragItem] = useState(null)
  const [dragOverPanel, setDragOverPanel] = useState(null) // panelId
  const [dragOverValid, setDragOverValid] = useState(false)

  // Panellere bırakılan öğeler
  // Yeşil kabul eden: big1, big2  |  Kırmızı kabul eden: side1, side2
  const [panelItems, setPanelItems] = useState({
    big1: [],
    big2: [],
    side1: [],
    side2: [],
  })

  // Video botu için panel bazlı URL inputları
  const [videoInputs, setVideoInputs] = useState({ big1: '', big2: '', side1: '', side2: '' })

  const hasItem = (panelId) => (panelItems[panelId] && panelItems[panelId].length > 0)

  const handleDragStart = (btn) => (e) => {
    setDragItem(btn)
    e.dataTransfer.setData('application/json', JSON.stringify(btn))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragEnd = () => {
    setDragItem(null)
    setDragOverPanel(null)
    setDragOverValid(false)
  }

  const isValidForPanel = (panelId, itemColor) => {
    const acceptColor = (panelId === 'big1' || panelId === 'big2') ? 'green' : 'red'
    return itemColor === acceptColor
  }

  const onDragOverPanel = (panelId) => (e) => {
    e.preventDefault()
    const item = dragItem || safeParse(e.dataTransfer.getData('application/json'))
    const filled = hasItem(panelId)
    const valid = item ? isValidForPanel(panelId, item.color) && !filled : false
    setDragOverPanel(panelId)
    setDragOverValid(!!valid)
    e.dataTransfer.dropEffect = valid ? 'copy' : 'none'
  }

  const onDragLeavePanel = () => {
    setDragOverPanel(null)
    setDragOverValid(false)
  }

  const onDropToPanel = (panelId) => (e) => {
    e.preventDefault()
    const item = dragItem || safeParse(e.dataTransfer.getData('application/json'))
    const filled = hasItem(panelId)
    const valid = item && isValidForPanel(panelId, item.color) && !filled
    setDragOverPanel(null)
    setDragOverValid(false)
    if (!valid) return

    setPanelItems((prev) => ({ ...prev, [panelId]: [item] }))
  }

  const removeFromPanel = (panelId, key) => {
    setPanelItems((prev) => ({
      ...prev,
      [panelId]: prev[panelId].filter((i) => i.key !== key),
    }))
  }

  const renderBotCard = (panelId) => {
    const i = panelItems[panelId]?.[0]
    if (!i) return null
    return (
      <div className={`bot-card ${i.color}`}>
        <div className="bot-card-label">{i.label}</div>
        <CloseButton 
                  onClick={() => removeFromPanel(panelId, i.key)}
                  variant="embedded"
                  size="small"
                  className="bot-card-remove"
                  ariaLabel="Kaldır"
                />
      </div>
    )
  }

  const renderPanelContent = (panelId) => {
    const i = panelItems[panelId]?.[0]
    if (!i) return null

    // Müzik botu bırakıldığında şarkı listemiz componentini gömülü göster
    if (i.key === 'music') {
      return (
        <div className="bot-embed">
          <CloseButton 
            onClick={() => removeFromPanel(panelId, i.key)}
            variant="embedded"
            size="small"
            className="bot-embed-remove"
            ariaLabel="Kaldır"
          />
          <MusicPlayer embedded />
        </div>
      )
    }

    // Film Seçici botu bırakıldığında Film önerileri componentini gömülü göster
    if (i.key === 'movie') {
      return (
        <div className="bot-embed">
          <CloseButton 
            onClick={() => removeFromPanel(panelId, i.key)}
            variant="embedded"
            size="small"
            className="bot-embed-remove"
            ariaLabel="Kaldır"
          />
          <MovieRecommendations embedded />
        </div>
      )
    }

    // Video oynatıcı botu: URL gir, YouTube veya direkt video dosyası ya da web sitesi olarak oynat/göster
    if (i.key === 'video') {
      const value = videoInputs[panelId] || ''
      
      // YouTube URL'si mi kontrol et
      const extractVideoId = (url) => {
        if (!url) return null
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\n]+)/)
        return match ? match[1] : null
      }

      // Direkt video dosyası mı? (mp4, webm, ogg, mov, m4v)
      const isDirectVideoFile = (url) => {
        if (!url) return false
        return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)
      }

      // Protokol ekle (http/https yoksa https varsay)
      const ensureProtocol = (url) => {
        if (!url) return ''
        if (/^https?:\/\//i.test(url)) return url
        return `https://${url}`
      }
      
      const youtubeVideoId = extractVideoId(value)
      const isVideoFile = isDirectVideoFile(value)
      const normalizedUrl = ensureProtocol(value)
      
      return (
        <div className="bot-embed">
          <CloseButton 
            onClick={() => removeFromPanel(panelId, i.key)}
            variant="embedded"
            size="small"
            className="bot-embed-remove"
            ariaLabel="Kaldır"
          />
          <div className="video-player embedded">
            <div className="video-controls">
              <input
                className="video-input"
                type="text"
                placeholder="Video veya site linkini yapıştırın (YouTube, mp4, webm, web sitesi vb.)"
                value={value}
                onChange={(e) => setVideoInputs((prev) => ({ ...prev, [panelId]: e.target.value }))}
              />
              {value ? (
                <>
                  <a
                    className="action"
                    href={normalizedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Yeni sekmede aç"
                  >
                    Yeni sekmede aç
                  </a>
                  <button
                    type="button"
                    className="action"
                    onClick={() => setVideoInputs((prev) => ({ ...prev, [panelId]: '' }))}
                    title="Linki temizle"
                  >
                    Temizle
                  </button>
                </>
              ) : null}
            </div>
            <div className="video-canvas">
              {value ? (
                youtubeVideoId ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&origin=${window.location.origin}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    title="YouTube Player"
                    style={{ borderRadius: '10px' }}
                  />
                ) : isVideoFile ? (
                  <video 
                    controls 
                    playsInline 
                    src={`${API_BASE_URL}/video/stream?url=${encodeURIComponent(value)}`}
                    style={{ borderRadius: '10px' }}
                  />
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    src={normalizedUrl}
                    frameBorder="0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    title={normalizedUrl}
                    style={{ borderRadius: '10px', background: '#fff' }}
                  />
                )
              ) : (
                <div style={{ color: '#6b7280', fontWeight: 600 }}>
                  Başlamak için bir video veya web sitesi linki girin
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Diğer botlar için şimdilik kart görünümü
    return renderBotCard(panelId)
  }

  return (
    <div className="page-container bots-page">
      {/* Başlık kaldırıldı: alanı büyütmek için */}
      <div className="bots-toolbar">
        {buttons.map((b, idx) => (
          <button
            key={b.key}
            type="button"
            className={`pill-btn ${b.color} ${idx === 0 ? 'active' : ''}`}
            draggable
            onDragStart={handleDragStart(b)}
            onDragEnd={handleDragEnd}
            onClick={() => { /* Fonksiyonlar daha sonra eklenecek */ }}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="bots-content">
        <div className="bots-left">
          <div
            className={`panel success tall ${(dragOverPanel === 'big1' ? (dragOverValid ? 'drop-allowed' : 'drop-blocked') : '')} ${!hasItem('big1') ? 'empty' : ''}`}
            onDragOver={onDragOverPanel('big1')}
            onDragLeave={onDragLeavePanel}
            onDrop={onDropToPanel('big1')}
          >
            <div className="panel-body">
              {hasItem('big1') ? renderPanelContent('big1') : null}
            </div>
          </div>

          <div
            className={`panel success tall ${(dragOverPanel === 'big2' ? (dragOverValid ? 'drop-allowed' : 'drop-blocked') : '')} ${!hasItem('big2') ? 'empty' : ''}`}
            onDragOver={onDragOverPanel('big2')}
            onDragLeave={onDragLeavePanel}
            onDrop={onDropToPanel('big2')}
          >
            <div className="panel-body">
              {hasItem('big2') ? renderPanelContent('big2') : null}
            </div>
          </div>
        </div>

        <div className="bots-right">
          <div
            className={`panel danger tall ${(dragOverPanel === 'side1' ? (dragOverValid ? 'drop-allowed' : 'drop-blocked') : '')} ${!hasItem('side1') ? 'empty' : ''}`}
            onDragOver={onDragOverPanel('side1')}
            onDragLeave={onDragLeavePanel}
            onDrop={onDropToPanel('side1')}
          >
            <div className="panel-body">
              {hasItem('side1') ? renderPanelContent('side1') : null}
            </div>
          </div>

          <div
            className={`panel danger tall ${(dragOverPanel === 'side2' ? (dragOverValid ? 'drop-allowed' : 'drop-blocked') : '')} ${!hasItem('side2') ? 'empty' : ''}`}
            onDragOver={onDragOverPanel('side2')}
            onDragLeave={onDragLeavePanel}
            onDrop={onDropToPanel('side2')}
          >
            <div className="panel-body">
              {hasItem('side2') ? renderPanelContent('side2') : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function safeParse(str) {
  try { return JSON.parse(str) } catch { return null }
}

export default BotsPage