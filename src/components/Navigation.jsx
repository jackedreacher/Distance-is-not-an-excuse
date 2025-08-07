import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Navigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Update isMobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = [
    { path: '/', label: '🏠 Ana Sayfa', },
    { path: '/weather', label: '🌍 Hava Durumu', },
    { path: '/love-messages', label: '💌 Aşk Mesajları', },
    { path: '/motivation', label: '🌟 Motivasyon', },
    { path: '/movies', label: '🎬 Filmler', },
    { path: '/mesafe-oyunu', label: '💞 Mesafe Oyunu', }
  ]

  const handleNavigation = (path) => {
    navigate(path)
  }

  if (isMobile) {
    // Mobile bottom navigation
    return (
      <nav className="mobile-navigation">
        <div className="mobile-nav-container">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </nav>
    )
  } else {
    // Desktop sidebar navigation
    return (
      <nav className="desktop-navigation">
        <div className="desktop-nav-container">
          <h2 className="nav-title">💕 Aşkımızın Hikayesi 💕</h2>
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item-wrapper">
                <button
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    )
  }
}

export default Navigation