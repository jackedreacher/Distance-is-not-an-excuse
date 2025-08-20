import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/icon.svg'
import CloseButton from './shared/CloseButton'
import '../styles/variables.css'
import '../styles/navigation.css'
import plush from '../assets/plush.svg'

  const Navigation = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const [isMegaOpen, setIsMegaOpen] = useState(false)
  const closeBtnRef = useRef(null)
  
  // Update isMobile state on window resize
  useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768)
      }
  
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    // Close mega menu with ESC
    useEffect(() => {
      const onKeyDown = (e) => {
        if (e.key === 'Escape') setIsMegaOpen(false)
      }
      if (isMegaOpen) {
        window.addEventListener('keydown', onKeyDown)
        // Focus close button when panel opens
        setTimeout(() => closeBtnRef.current?.focus(), 0)
      }
      return () => window.removeEventListener('keydown', onKeyDown)
    }, [isMegaOpen])
    
    // Close mega menu on route changes (e.g., back/forward navigation)
    useEffect(() => {
      if (isMegaOpen) setIsMegaOpen(false)
    }, [location.pathname])
    
    // Helper to split emoji/icon and text
    const parseLabel = (label) => {
      const [icon, ...rest] = label.split(' ')
      return { icon, text: rest.join(' ') }
    }
    
    const navItems = [
      { path: '/', label: '🏠 Ana Sayfa' },
      //{ path: '/bots', label: '🤖 Botlar' },
      { path: '/weather', label: '🌍 Hava Durumu' },
      { path: '/love-messages', label: '💌 Aşk Mesajları' },
      { path: '/motivation', label: '🌟 Motivasyon' },
      { path: '/movies', label: '🎬 Filmler' },
      { path: '/mesafe-oyunu', label: '💞 Mesafe Oyunu' },
      { path: '/mood-tracker', label: '😊 Ruh Halimiz' },
      { path: '/wishlist', label: '心愿 Dilek Listesi' },
      { path: '/music-playlist', label: '🎵 Şarkı Listemiz' },
      { path: '/surprise-notifications', label: '🎉 Sürprizler' }
    ]

    const handleNavigation = (path) => {
      navigate(path)
    }

    const sections = [
      {
        title: 'Öne Çıkanlar', icon: '✨', desc: 'En sevdiğimiz bölümler',
        items: [
          { path: '/', label: '🏠 Ana Sayfa' },
          { path: '/wishlist', label: '心愿 Dilek Listesi' },
          { path: '/surprise-notifications', label: '🎉 Sürprizler' },
        ]
      },
      {
        title: 'Duygular & Mesajlar', icon: '💖', desc: 'Kalpten paylaşımlar',
        items: [
          { path: '/love-messages', label: '💌 Aşk Mesajları' },
          { path: '/mood-tracker', label: '😊 Ruh Halimiz' },
          { path: '/motivation', label: '🌟 Motivasyon' },
        ]
      },
      {
        title: 'Eğlence', icon: '🎲', desc: 'Birlikte eğlenelim',
        items: [
          { path: '/mesafe-oyunu', label: '💞 Mesafe Oyunu' },
          { path: '/movies', label: '🎬 Filmler' },
          { path: '/music-playlist', label: '🎵 Şarkı Listemiz' },
        ]
      },
      {
        title: 'Günlük', icon: '🌤️', desc: 'Günlük hayatı kolaylaştır',
        items: [
          { path: '/weather', label: '🌍 Hava Durumu' },
        ]
      },
    ]

    const toggleMega = () => setIsMegaOpen((v) => !v)
    const closeMega = () => {
      setIsMegaOpen(false)
    }
  
    if (isMobile) {
      // Mobile bottom navigation
      return (
        <nav className="mobile-navigation">
          <div className="mobile-nav-container">
            {navItems.map((item) => {
              const { icon, text } = parseLabel(item.label)
              return (
                <button
                  key={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <span className="nav-label">{icon}</span>
                  <span className="nav-label">{text}</span>
                </button>
              )
            })}
          </div>
        </nav>
      )
    } else {
      // Desktop top navigation (pills/cards style) with brand + mega menu + CTA
      return (
        <>
          <nav className="desktop-navigation" aria-label="Ana menü">
            <div className="desktop-nav-container">
              <div className="nav-center-group">
                <a className="nav-brand" href="#" onClick={(e)=>{e.preventDefault(); handleNavigation('/')}}>
                  <div className="brand-logo-stack" aria-hidden="true">
                    <span className="nav-logo">
                      <img src={logo} width="24" height="24" alt="" style={{borderRadius: 6}} />
                    </span>
                    <img src={plush} alt="Mis.Squirrel" className="brand-plush-name" />
                  </div>
                </a>
                <button className={`mega-menu-button expandable gradient ${isMegaOpen ? 'active' : ''}`} onClick={toggleMega} aria-haspopup="dialog" aria-expanded={isMegaOpen}>
                  <span className="icon">☰</span>
                  <span className="txt">Menü</span>
                </button>
              </div>
            </div>
          </nav>
  
          {/* Mega Menu Overlay */}
          <div className={`mega-menu-overlay ${isMegaOpen ? 'open' : ''}`} onClick={closeMega}>
            <div className="mega-menu-panel" role="dialog" aria-modal="true" aria-labelledby="mega-menu-title" onClick={(e)=>e.stopPropagation()}>
              <div className="mega-menu-header">
                <h3 id="mega-menu-title" className="mega-menu-title">Keşfet</h3>
                <CloseButton 
                  ref={closeBtnRef}
                  onClick={closeMega}
                  variant="overlay"
                  size="medium"
                  className="mega-menu-close"
                  ariaLabel="Kapat"
                />
              </div>
  
              <div className="mega-menu-grid">
                {sections.map((section) => (
                  <section key={section.title} className="mega-menu-section" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter'){ const first = section.items?.[0]; if(first){ handleNavigation(first.path); closeMega(); } } }} onClick={()=>{ const first = section.items?.[0]; if(first){ handleNavigation(first.path); closeMega(); } }}>
                    <div className="mega-menu-section-icon" aria-hidden="true">{section.icon}</div>
                    <h4 className="mega-menu-section-title">{section.title}</h4>
                    <p className="mega-menu-section-desc">{section.desc}</p>
                    <ul className="mega-menu-section-items">
                      {section.items.map((it) => {
                        const { text } = parseLabel(it.label)
                        return (
                          <li key={it.path} className="mega-menu-section-item" onClick={(e)=>{ e.stopPropagation(); handleNavigation(it.path); closeMega(); }}>{text}</li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </>
      )
    }
  }

  export default Navigation