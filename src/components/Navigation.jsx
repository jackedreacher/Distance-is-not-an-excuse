import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/Mis.gif'
import CloseButton from './shared/CloseButton'
import '../styles/variables.css'
import '../styles/navigation.css'
// removed: import plush from '../assets/plush.svg'

  const Navigation = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [isMegaOpen, setIsMegaOpen] = useState(false)
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const closeBtnRef = useRef(null)
  
    // Detect mobile screen size
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Close mega menu with ESC
    useEffect(() => {
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsMegaOpen(false)
          setIsMobileNavOpen(false)
        }
      }
      if (isMegaOpen || isMobileNavOpen) {
        window.addEventListener('keydown', onKeyDown)
        // Focus close button when panel opens
        setTimeout(() => closeBtnRef.current?.focus(), 0)
      }
      return () => window.removeEventListener('keydown', onKeyDown)
    }, [isMegaOpen, isMobileNavOpen])
    
    // Close mega menu on route changes (e.g., back/forward navigation)
    useEffect(() => {
      if (isMegaOpen) setIsMegaOpen(false)
      if (isMobileNavOpen) setIsMobileNavOpen(false)
    }, [location.pathname])
    
    // Helper to split emoji/icon and text
    const parseLabel = (label) => {
      const [icon, ...rest] = label.split(' ')
      return { icon, text: rest.join(' ') }
    }
    

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

    const toggleMega = () => {
      setIsMegaOpen((v) => !v)
      // Close mobile nav when mega menu opens
      if (!isMegaOpen) setIsMobileNavOpen(false)
    }
    const closeMega = () => {
      setIsMegaOpen(false)
    }
    
    const toggleMobileNav = () => {
      // On mobile, directly toggle mega menu instead of navbar
      if (isMobile) {
        setIsMegaOpen((v) => !v)
      } else {
        setIsMobileNavOpen((v) => !v)
      }
    }
    const closeMobileNav = () => {
      setIsMobileNavOpen(false)
    }
  
    // Render mobile toggle button and desktop navigation
    return (
      <>
        {/* Mobile Navigation Toggle Button */}
        {isMobile && (
          <button 
            className={`mobile-nav-toggle ${isMegaOpen ? 'active' : ''}`}
            onClick={toggleMobileNav}
            aria-label="Menüyü aç/kapat"
          >
            <span className="toggle-icon">{isMegaOpen ? '✕' : '☰'}</span>
          </button>
        )}

        {/* Desktop Navigation - always visible on desktop, slide-in on mobile */}
        <nav className={`desktop-navigation ${isMobile ? (isMobileNavOpen ? 'mobile-open' : 'mobile-closed') : ''}`} aria-label="Ana menü">
          <div className="desktop-nav-container">
            <div className="nav-center-group">
              <a className="nav-brand" href="#" onClick={(e)=>{e.preventDefault(); handleNavigation('/')}}>
                <div className="brand-logo-stack" aria-hidden="true">
                  <span className="nav-logo">
                    <img src={logo} alt="Logo" style={{ margin: '4px', width: 48, height: 48, borderRadius: 12, transform: 'scale(3.5)', transformOrigin: 'center' }} />
                  </span>
                  {/* removed Miss Squirrel text image */}
                </div>
              </a>
              <button className={`mega-menu-button expandable gradient ${isMegaOpen ? 'active' : ''}`} onClick={toggleMega} aria-haspopup="dialog" aria-expanded={isMegaOpen}>
                <span className="icon">☰</span>
                <span className="txt">Menü</span>
              </button>
              {/* Mobile close button */}
              {isMobile && isMobileNavOpen && (
                <CloseButton 
                  onClick={closeMobileNav}
                  variant="overlay"
                  size="small"
                  className="mobile-nav-close"
                  ariaLabel="Kapat"
                />
              )}
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Overlay */}
        {isMobile && isMobileNavOpen && (
          <div className="mobile-nav-overlay" onClick={closeMobileNav}></div>
        )}

        {/* Mega Menu Overlay */}
        <div className={`mega-menu-overlay ${isMegaOpen ? 'open' : ''}`} onClick={closeMega}>
          <div className="mega-menu-panel" role="dialog" aria-modal="true" aria-labelledby="mega-menu-title" onClick={(e)=>e.stopPropagation()}>
            <div className="mega-menu-header">
              <div className="mega-menu-logo">
                <img src={logo} alt="Logo" className="mega-menu-logo-img" />
              </div>
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

  export default Navigation