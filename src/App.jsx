import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
// import './App.css'
import './styles/variables.css'
import './styles/base.css'
import './styles/navigation.css'
import './styles/movies.css'
import './styles/wishlist.css'
import './styles/music.css'
import './styles/games.css'
import './styles/player.css'
import './styles/romantic.css'
import './styles/responsive.css'
import './styles/pixel.css'

// Import utility functions
import { calculateTimeDifference } from './utils/timeUtils'

// Import components
import CountdownTimer from './components/CountdownTimer'
import GiftBox from './components/GiftBox'
 import Navigation from './components/Navigation'
import MiniPlayer from './components/MiniPlayer'
// Removed custom Pixel components
// import PixelCard from './components/PixelCard'
// import PixelButton from './components/PixelButton'
import PixelButton from './components/PixelButton'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Search, Plus, Info, Smile } from 'lucide-react'

// Import pages
import WeatherPage from './pages/WeatherPage'
import LoveMessagesPage from './pages/LoveMessagesPage'
import DailyMotivationPage from './pages/DailyMotivationPage'
import MovieRecommendationsPage from './pages/MovieRecommendationsPage'
import MesafeOyunuPage from './pages/MesafeOyunuPage'
import MoodTrackerPage from './pages/MoodTrackerPage'
import WishlistPage from './pages/WishlistPage'
import MusicPlaylistPage from './pages/MusicPlaylistPage'
import SurpriseNotificationsPage from './pages/SurpriseNotificationsPage'
import BotsPage from './pages/BotsPage'

// Import Contexts
import { SocketProvider } from './contexts/SocketContext.jsx'
import GlobalHeroPlayer from './components/GlobalHeroPlayer'
import { usePlayer } from './contexts/PlayerContext.jsx'
import { wishlistService, moodService } from './services/api'
import MovieRecommendations from './components/MovieRecommendations'
import SharedPlanning from './components/shared/SharedPlanning.jsx'

import TogetherApproach from './components/TogetherApproach'
import Icon1 from './assets/Untitled design (1).svg'
import Icon2 from './assets/Untitled design (2).svg'

function App() {
  const [daysApart, setDaysApart] = useState(0)
  const [hoursApart, setHoursApart] = useState(0)
  const [minutesApart, setMinutesApart] = useState(0)
  const [secondsApart, setSecondsApart] = useState(0)
  // Hero Player Visibility State
  const [showHeroPlayer, setShowHeroPlayer] = useState(false)
  // Toggle button visibility state
  const [isToggleVisible, setIsToggleVisible] = useState(true)
  // Swipe state for hero drawer
  const [heroTouchStartX, setHeroTouchStartX] = useState(null)
  const [heroSwipeHandled, setHeroSwipeHandled] = useState(false)
  // Mobile interactive features

  const [pullToRefresh, setPullToRefresh] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)


  // Story Timeline: recent data blocks
  const [recentWishes, setRecentWishes] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [recentMoods, setRecentMoods] = useState([])
  const [moodsLoading, setMoodsLoading] = useState(false)

  // Quick Wish state
  const [quickWishTitle, setQuickWishTitle] = useState('')
  const [quickWishCategory, setQuickWishCategory] = useState('restaurants')
  const [quickWishPriority, setQuickWishPriority] = useState('medium')
  const [quickWishGender, setQuickWishGender] = useState('female')
  const [quickWishLoading, setQuickWishLoading] = useState(false)
  const [quickWishSuccess, setQuickWishSuccess] = useState(false)
  const [quickWishError, setQuickWishError] = useState('')

  // Quick Wish helpers
  const quickCategories = [
    { id: 'restaurants', name: 'Restoranlar', icon: '🍽️' },
    { id: 'travel', name: 'Seyahat', icon: '✈️' },
    { id: 'activities', name: 'Aktiviteler', icon: '🎪' },
    { id: 'gifts', name: 'Hediyeler', icon: '🎁' },
  ]
  const quickPriorities = [
    { id: 'low', name: 'Düşük' },
    { id: 'medium', name: 'Orta' },
    { id: 'high', name: 'Yüksek' },
  ]

  // Quick Mood state
  const [quickMood, setQuickMood] = useState('')
  const [quickMoodGender, setQuickMoodGender] = useState('female')
  const [quickMoodMessage, setQuickMoodMessage] = useState('')
  const [quickMoodLoading, setQuickMoodLoading] = useState(false)
  const [quickMoodSuccess, setQuickMoodSuccess] = useState(false)
  const [quickMoodError, setQuickMoodError] = useState('')

  // Quick Mood options
  const quickMoods = [
    { id: 'happy', emoji: '😊', label: 'Mutlu' },
    { id: 'sad', emoji: '😢', label: 'Üzgün' },
    { id: 'angry', emoji: '😠', label: 'Kızgın' },
    { id: 'excited', emoji: '😍', label: 'Heyecanlı' },
    { id: 'tired', emoji: '😴', label: 'Yorgun' },
  ]

  // Categories mapping for wishlist preview
  const wishCategories = [
    { id: 'restaurants', name: 'Restoranlar', icon: '🍽️' },
    { id: 'travel', name: 'Seyahat', icon: '✈️' },
    { id: 'activities', name: 'Aktiviteler', icon: '🎪' },
    { id: 'gifts', name: 'Hediyeler', icon: '🎁' },
  ]
  const getCategoryInfo = (id) => wishCategories.find((c) => c.id === id) || wishCategories[0]

  // Mood options mapping for emoji/label when summarizing
  const moodOptions = [
    { value: 'happy', emoji: '😊', label: 'Mutlu' },
    { value: 'excited', emoji: '🤩', label: 'Heyecanlı' },
    { value: 'love', emoji: '🥰', label: 'Aşık' },
    { value: 'grateful', emoji: '🙏', label: 'Minnettar' },
    { value: 'peaceful', emoji: '😌', label: 'Huzurlu' },
    { value: 'sad', emoji: '😢', label: 'Üzgün' },
    { value: 'angry', emoji: '😠', label: 'Kızgın' },
    { value: 'anxious', emoji: '😰', label: 'Endişeli' },
    { value: 'tired', emoji: '😴', label: 'Yorgun' },
    { value: 'sick', emoji: '🤒', label: 'Hasta' },
  ]
  const getMoodInfo = (val) => moodOptions.find((m) => m.value === val) || { emoji: '❓', label: 'Bilinmiyor' }

  // Submit handler for Quick Mood
  const handleQuickMoodSubmit = async () => {
    if (!quickMood || !quickMoodGender) {
      setQuickMoodError('Lütfen ruh hali ve kişi seçin')
      return
    }
    try {
      setQuickMoodLoading(true)
      setQuickMoodError('')
      setQuickMoodSuccess(false)
      const moodData = {
        mood: quickMood,
        message: quickMoodMessage,
        gender: quickMoodGender,
      }
      const data = await moodService.create(moodData)
      if (data && (data.mood || data._id)) {
        setQuickMoodSuccess(true)
        setQuickMood('')
        setQuickMoodMessage('')
      } else {
        setQuickMoodError('Bir şeyler ters gitti. Lütfen tekrar deneyin.')
      }
    } catch (err) {
      console.error('Quick mood save error:', err)
      setQuickMoodError('Kaydedilemedi. Lütfen bağlantınızı kontrol edin.')
    } finally {
      setQuickMoodLoading(false)
    }
  }

  // Submit handler for Quick Wish
  const handleQuickWishSubmit = async () => {
    if (!quickWishTitle.trim()) {
      setQuickWishError('Lütfen bir başlık yazın')
      return
    }
    try {
      setQuickWishLoading(true)
      setQuickWishError('')
      setQuickWishSuccess(false)
      const itemData = {
        title: quickWishTitle.trim(),
        category: quickWishCategory,
        description: '',
        priority: quickWishPriority,
        gender: quickWishGender,
        completed: false,
      }
      const data = await wishlistService.create(itemData)
      if (data && (data._id || data.title)) {
        setQuickWishSuccess(true)
        setQuickWishTitle('')
      } else {
        setQuickWishError('Bir şeyler ters gitti. Lütfen tekrar deneyin.')
      }
    } catch (err) {
      console.error('Quick wish save error:', err)
      setQuickWishError('Kaydedilemedi. Lütfen bağlantınızı kontrol edin.')
    } finally {
      setQuickWishLoading(false)
    }
  }

  const { currentSong, currentVideoId } = usePlayer()
  const navigate = useNavigate()
  const location = useLocation()

  // Theme: apply Pastel Candy globally
  useEffect(() => {
    const body = document.body
    body.classList.add('theme-pastel-candy')
    return () => {
      body.classList.remove('theme-pastel-candy')
    }
  }, [])

  // Pull to refresh functionality
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY)
    setHeroTouchStartX(e.touches[0].clientX)
    setHeroSwipeHandled(false)
  }

  const handleTouchMove = (e) => {
    const touchY = e.touches[0].clientY
    const diff = touchStartY - touchY
    
    if (diff > 100 && window.scrollY === 0) {
      setPullToRefresh(true)
    }

    // Horizontal swipe for right-side drawer
    const touchX = e.touches[0].clientX
    const startX = heroTouchStartX ?? touchX
    const deltaX = touchX - startX
    if (!heroSwipeHandled) {
      // Close when swiping to the right while drawer is open
      if (showHeroPlayer && deltaX > 60) {
        setShowHeroPlayer(false)
        setHeroSwipeHandled(true)
      }
      // Open when swiping from the right edge to the left while drawer is closed
      else if (!showHeroPlayer && startX > window.innerWidth - 24 && deltaX < -60) {
        setShowHeroPlayer(true)
        setHeroSwipeHandled(true)
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullToRefresh) {
      // Simulate refresh
      setTimeout(() => {
        setPullToRefresh(false)
        window.location.reload()
      }, 1000)
    }
    setHeroTouchStartX(null)
    setHeroSwipeHandled(false)
  }



  // When clicking the hero player toggle, if there is no current song/video yet, go to playlist
  const handleHeroToggleClick = () => {
    if (!showHeroPlayer && !currentSong && !currentVideoId) {
      navigate('/music-playlist')
      return
    }
    setShowHeroPlayer((v) => !v)
  }

  useEffect(() => {
    const updateTime = () => {
      const { days, hours, minutes, seconds } = calculateTimeDifference()
      setDaysApart(days)
      setHoursApart(hours)
      setMinutesApart(minutes)
      setSecondsApart(seconds)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])



  // Load recent wishlist items and moods for the story timeline
  const loadRecent = async () => {
    try {
      setWishlistLoading(true)
      const w = await wishlistService.getAll()
      const arr = Array.isArray(w) ? w : (Array.isArray(w?.data) ? w.data : [])
      const sorted = arr
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
      setRecentWishes(sorted)
    } catch (e) {
      console.error('Wishlist preview error', e)
      setRecentWishes([])
    } finally {
      setWishlistLoading(false)
    }

    try {
      setMoodsLoading(true)
      const m = await moodService.getAll()
      const arrM = Array.isArray(m) ? m : (Array.isArray(m?.data) ? m.data : [])
      const sortedM = arrM
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5)
      setRecentMoods(sortedM)
    } catch (e) {
      console.error('Mood preview error', e)
      setRecentMoods([])
    } finally {
      setMoodsLoading(false)
    }
  }

  useEffect(() => {
    loadRecent()
  }, [])


  // Close drawer on ESC key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && showHeroPlayer) {
        setShowHeroPlayer(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showHeroPlayer])

  // Close hero drawer on route change to avoid backdrop blocking clicks
  useEffect(() => {
    if (showHeroPlayer) {
      setShowHeroPlayer(false)
    }
  }, [location.pathname])

  return (
      <SocketProvider>
          <div
            className="app-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation - geçici olarak devre dışı */}
            <Navigation /> 
            {/* Hero Player Toggle Button */}
            {!showHeroPlayer && (
              <div 
                className="hero-toggle-area"
                onMouseEnter={() => setIsToggleVisible(true)}
                onTouchStart={() => setIsToggleVisible(true)}
              >
                {isToggleVisible ? (
                  <PixelButton 
                    type="button"
                    className="hero-toggle-btn visible"
                    aria-label="Müzik çalarını aç"
                    onClick={handleHeroToggleClick}
                    onMouseLeave={() => setIsToggleVisible(false)}
                    onTouchEnd={() => setIsToggleVisible(false)}
                  >
                    🎵 Çaları Aç
                  </PixelButton>
                ) : (
                   <PixelButton 
                     type="button"
                     className="hero-toggle-btn hidden-arrow pixel-btn-icon"
                     aria-label="Müzik çalarını göster"
                     onClick={() => setIsToggleVisible(true)}
                   >
                     ◀
                   </PixelButton>
                 )}
              </div>
            )}

            {/* Backdrop for Right-side Drawer */}
            {showHeroPlayer && (
              <div
                className={`hero-backdrop ${showHeroPlayer ? 'open' : ''}`}
                onClick={() => setShowHeroPlayer(false)}
              />
            )}

            {/* Right-side Drawer for GlobalHeroPlayer */}
            <div className={`hero-drawer ${showHeroPlayer ? 'open' : ''}`}>
              <GlobalHeroPlayer onClose={() => setShowHeroPlayer(false)} />
            </div>
            
            {/* Pull to refresh indicator */}
            {pullToRefresh && (
              <div className="pull-to-refresh">
                <div className="refresh-spinner">🔄</div>
                <p>Yenileniyor...</p>
              </div>
            )}
            
            {/* Hearts background devre dışı (CRT arka plan için) */}
            
            {/* Gift Box and Squirrel */}
            
            
            <div className="main-content">
              {/* Removed inline GlobalHeroPlayer rendering to avoid nesting inside content */}
              <Routes>
                {/* Main page with interactive components */}
                
                <Route path="/" element={
                  <div className="container">
                    <header className="header">
                      <div className="countdown-header">
                        <div className="countdown-icons">
                        
                        </div>
                      
                    <TogetherApproach />
                      </div>
                       <p className="subtitle">Her an bizi birbirimize daha da yaklaştırıyor...</p>

                      {/* Hızlı aksiyonlar */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="pixel-btn-sm">
                              <Plus className="mr-1" size={16} /> Hızlı Dilek
                            </Button>
                          </DialogTrigger>
                         <DialogContent>
                           <DialogHeader>
                             <DialogTitle>Yeni Dilek Ekle</DialogTitle>
                             <DialogDescription>Birlikte yapmak istediğiniz bir şeyi hızlıca ekleyin.</DialogDescription>
                           </DialogHeader>
                           {quickWishSuccess ? (
                             <div className="grid" style={{ gap: 8 }}>
                               <div style={{
                                 background: 'var(--pixel-green, #22c55e)',
                                 color: 'white',
                                 padding: 8,
                                 borderRadius: 4,
                                 textAlign: 'center',
                                 fontWeight: 600
                               }}>✅ Dilek eklendi!</div>
                             </div>
                           ) : (
                             <>
                               <div className="grid" style={{ gap: 8 }}>
                                 <Label htmlFor="quick-wish">Dilek Başlığı</Label>
                                 <Input
                                   id="quick-wish"
                                   placeholder="Örn: Boğazda yürüyüş"
                                   value={quickWishTitle}
                                   onChange={(e) => setQuickWishTitle(e.target.value)}
                                 />
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                 <Label>Kategori</Label>
                                 <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                   {quickCategories.map((cat) => (
                                     <Button
                                       key={cat.id}
                                       size="sm"
                                       className="pixel-btn-sm"
                                       variant={quickWishCategory === cat.id ? 'default' : 'outline'}
                                       onClick={() => setQuickWishCategory(cat.id)}
                                     >
                                       <span style={{ marginRight: 4 }}>{cat.icon}</span>{cat.name}
                                     </Button>
                                   ))}
                                 </div>
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                 <Label>Öncelik</Label>
                                 <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                   {quickPriorities.map((p) => (
                                     <Button
                                       key={p.id}
                                       size="sm"
                                       className="pixel-btn-sm"
                                       variant={quickWishPriority === p.id ? 'default' : 'outline'}
                                       onClick={() => setQuickWishPriority(p.id)}
                                     >
                                       {p.name}
                                     </Button>
                                   ))}
                                 </div>
                               </div>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                 <Label>Kim için?</Label>
                                 <div style={{ display: 'flex', gap: 6 }}>
                                   <Button
                                     size="sm"
                                     className="pixel-btn-sm"
                                     variant={quickWishGender === 'female' ? 'default' : 'outline'}
                                     onClick={() => setQuickWishGender('female')}
                                   >
                                     👩 mermi
                                   </Button>
                                   <Button
                                     size="sm"
                                     className="pixel-btn-sm"
                                     variant={quickWishGender === 'male' ? 'default' : 'outline'}
                                     onClick={() => setQuickWishGender('male')}
                                   >
                                     👨 yusuf
                                   </Button>
                                 </div>
                               </div>
                               {quickWishError && (
                                 <div style={{ color: 'var(--pixel-red, #ef4444)', fontSize: 12 }}>
                                   {quickWishError}
                                 </div>
                               )}
                             </>
                           )}
                           <DialogFooter>
                             {!quickWishSuccess ? (
                               <>
                                 <Button onClick={handleQuickWishSubmit} disabled={quickWishLoading || !quickWishTitle.trim()}>
                                   {quickWishLoading ? 'Kaydediliyor...' : 'Kaydet'}
                                 </Button>
                                 <DialogClose asChild>
                                   <Button variant="outline">Kapat</Button>
                                 </DialogClose>
                               </>
                             ) : (
                               <>
                                 <Button onClick={() => navigate('/wishlist')}>Listeye Git</Button>
                                 <Button variant="secondary" onClick={() => { setQuickWishSuccess(false); setQuickWishError(''); }}>
                                   Bir tane daha ekle
                                 </Button>
                                 <DialogClose asChild>
                                   <Button variant="outline">Kapat</Button>
                                 </DialogClose>
                               </>
                             )}
                           </DialogFooter>
                         </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="pixel-btn-sm">
                              <Smile className="mr-1" size={16} /> Hızlı Ruh Hali
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ruh Hali Kaydet</DialogTitle>
                              <DialogDescription>Bugünkü ruh halini hızlıca paylaş.</DialogDescription>
                            </DialogHeader>
                            {quickMoodSuccess ? (
                              <div className="grid" style={{ gap: 8 }}>
                                <div style={{
                                  background: 'var(--pixel-green, #22c55e)',
                                  color: 'white',
                                  padding: 8,
                                  borderRadius: 4,
                                  textAlign: 'center',
                                  fontWeight: 600
                                }}>✅ Ruh hali kaydedildi!</div>
                              </div>
                            ) : (
                              <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <Label>Ruh Hali</Label>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {quickMoods.map((m) => (
                                      <Button
                                        key={m.id}
                                        size="sm"
                                        className="pixel-btn-sm"
                                        variant={quickMood === m.id ? 'default' : 'outline'}
                                        onClick={() => setQuickMood(m.id)}
                                      >
                                        <span style={{ marginRight: 4 }}>{m.emoji}</span>{m.label}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <Label>Kim için?</Label>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <Button
                                      size="sm"
                                      className="pixel-btn-sm"
                                      variant={quickMoodGender === 'female' ? 'default' : 'outline'}
                                      onClick={() => setQuickMoodGender('female')}
                                    >
                                      👩 mermi
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="pixel-btn-sm"
                                      variant={quickMoodGender === 'male' ? 'default' : 'outline'}
                                      onClick={() => setQuickMoodGender('male')}
                                    >
                                      👨 yusuf
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid" style={{ gap: 8 }}>
                                  <Label htmlFor="quick-mood-msg">Mesaj (opsiyonel)</Label>
                                  <Input
                                    id="quick-mood-msg"
                                    placeholder="Kısaca eklemek ister misin?"
                                    value={quickMoodMessage}
                                    onChange={(e) => setQuickMoodMessage(e.target.value)}
                                  />
                                </div>
                                {quickMoodError && (
                                  <div style={{ color: 'var(--pixel-red, #ef4444)', fontSize: 12 }}>
                                    {quickMoodError}
                                  </div>
                                )}
                              </>
                            )}
                            <DialogFooter>
                              {!quickMoodSuccess ? (
                                <>
                                  <Button onClick={handleQuickMoodSubmit} disabled={quickMoodLoading || !quickMood || !quickMoodGender}>
                                    {quickMoodLoading ? 'Kaydediliyor...' : 'Kaydet'}
                                  </Button>
                                  <DialogClose asChild>
                                    <Button variant="outline">Kapat</Button>
                                  </DialogClose>
                                </>
                              ) : (
                                <>
                                  <Button onClick={() => navigate('/mood-tracker')}>Geçmişe Git</Button>
                                  <Button variant="secondary" onClick={() => { setQuickMoodSuccess(false); setQuickMoodError(''); }}>
                                    Bir tane daha ekle
                                  </Button>
                                  <DialogClose asChild>
                                    <Button variant="outline">Kapat</Button>
                                  </DialogClose>
                                </>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="outline" className="pixel-btn-sm" onClick={() => navigate('/bots')}>
                              <Info className="mr-1" size={16} /> Neler Yeni?
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Son eklenen özellikleri gör.</TooltipContent>
                        </Tooltip>
                      </div>
                    </header>
                    {/* Countdown Timer */}
                    <CountdownTimer
                      daysApart={daysApart}
                      hoursApart={hoursApart}
                      minutesApart={minutesApart}
                      secondsApart={secondsApart}
                    />

                    {/* Hızlı arama */}
                    <section className="pixel-section" style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                          <Label htmlFor="quick-search">Film ara</Label>
                          <Input id="quick-search" placeholder="Film, dizi, kişi..." />
                        </div>
                        <Button onClick={() => navigate('/movies')}>
                          <Search className="mr-1" size={16} /> Ara
                        </Button>
                      </div>
                    </section>

                    {/* Hikaye Anlatan Zaman Tüneli */}
                    <section className="pixel-section">
                      <h2 className="section-title pixel-retro" style={{ textAlign: 'center', marginBottom: 12 }}>✨ Son Eklenen Dilekler</h2>
                      {wishlistLoading ? (
                        <div style={{ textAlign: 'center' }}>Yükleniyor...</div>
                      ) : (
                        <div className="pixel-grid">
                          {recentWishes.length === 0 ? (
                            <Card><CardContent>Henüz dilek yok. İlk dileği ekleyelim mi? 💖</CardContent></Card>
                          ) : (
                            recentWishes.map(item => {
                              const cat = getCategoryInfo(item.category)
                              return (
                                <Card key={item._id || item.id}>
                                  <CardHeader>
                                    <CardTitle>{cat.icon} {item.title}</CardTitle>
                                    <CardDescription>{cat.name}</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                                      {item.description || '—'}
                                    </div>
                                  </CardContent>
                                  <CardFooter>
                                    <Badge variant="secondary">{new Date(item.createdAt || Date.now()).toLocaleDateString('tr-TR')}</Badge>
                                    <Button size="sm" className="pixel-btn-sm" onClick={()=>navigate('/wishlist')}>Listeyi Gör</Button>
                                  </CardFooter>
                                </Card>
                              )
                            })
                          )}
                        </div>
                      )}
                    </section>

                    <section className="pixel-section">
                      <h2 className="section-title pixel-retro" style={{ textAlign: 'center', marginBottom: 12 }}>🎬 Birlikte İzlenecek Filmler</h2>
                      <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                        <MovieRecommendations embedded={true} />
                      </div>
                    </section>

                    <section className="pixel-section">
                      <h2 className="section-title pixel-retro" style={{ textAlign: 'center', marginBottom: 12 }}>📝 Ruh Hali Günlüğünden Son Notlar</h2>
                      {moodsLoading ? (
                        <div style={{ textAlign: 'center' }}>Yükleniyor...</div>
                      ) : (
                        <div className="pixel-grid">
                          {recentMoods.length === 0 ? (
                            <Card><CardContent>Henüz bir not yok. Bugün nasıl hissediyorsun? 💌</CardContent></Card>
                          ) : (
                            recentMoods.map(m => {
                              const info = getMoodInfo(m.mood)
                              const genderLabel = m.gender === 'female' ? 'mermi' : m.gender === 'male' ? 'yusuf' : 'diğer'
                              return (
                                <Card key={m._id || m.id}>
                                  <CardHeader>
                                    <CardTitle>{info.emoji} {info.label}</CardTitle>
                                    <CardDescription>{genderLabel}</CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{m.message}</div>
                                  </CardContent>
                                  <CardFooter>
                                    <Badge variant="secondary">{new Date(m.createdAt || Date.now()).toLocaleDateString('tr-TR')}</Badge>
                                    <Button size="sm" className="pixel-btn-sm" onClick={()=>navigate('/mood-tracker')}>Tümünü Gör</Button>
                                  </CardFooter>
                                </Card>
                              )
                            })
                          )}
                        </div>
                      )}
                    </section>

                    <section className="pixel-section">
                      <h2 className="section-title pixel-retro" style={{ textAlign: 'center', marginBottom: 12 }}>📅 Anılar & Önemli Tarihler</h2>
                      <SharedPlanning channelId="love-timeline" />
                    </section>

                    {/* Pixelact UI (shadcn-style): Feature Cards */}
                    <section className="pixel-section">
                      <div className="pixel-grid">
                        <Card>
                          <CardHeader>
                            <CardTitle>Dilek Listesi <Badge variant="secondary">Tatlı</Badge></CardTitle>
                            <CardDescription>Birlikte yapmak istediklerimizi toplayalım.</CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button onClick={() => navigate('/wishlist')}>Aç</Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="pixel-btn-sm" onClick={() => navigate('/wishlist')}>Detay</Button>
                              </TooltipTrigger>
                              <TooltipContent>Listenin tamamını gör</TooltipContent>
                            </Tooltip>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Film Önerileri <Badge>Yeni</Badge></CardTitle>
                            <CardDescription>Bu akşam ne izleyelim? Pixel tadında seçelim.</CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button onClick={() => navigate('/movies')}>Keşfet</Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="pixel-btn-sm" onClick={() => navigate('/movies')}>Liste</Button>
                              </TooltipTrigger>
                              <TooltipContent>Öneri listesini aç</TooltipContent>
                            </Tooltip>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Müzik Listesi <Badge variant="secondary">Ruh</Badge></CardTitle>
                            <CardDescription>Beraber dinleyelim, ruhumuz eşlik etsin.</CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button onClick={() => navigate('/music-playlist')}>Oynat</Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="pixel-btn-sm" onClick={() => navigate('/music-playlist')}>Parçalar</Button>
                              </TooltipTrigger>
                              <TooltipContent>Çalma listesine git</TooltipContent>
                            </Tooltip>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Ruh Hali Takibi <Badge variant="secondary">Günlük</Badge></CardTitle>
                            <CardDescription>Bugün nasılsın? Birbirimizi daha iyi anlayalım.</CardDescription>
                          </CardHeader>
                          <CardFooter>
                            <Button onClick={() => navigate('/mood-tracker')}>Başla</Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="pixel-btn-sm" onClick={() => navigate('/mood-tracker')}>Geçmiş</Button>
                              </TooltipTrigger>
                              <TooltipContent>Geçmiş kayıtları gör</TooltipContent>
                            </Tooltip>
                          </CardFooter>
                        </Card>
                      </div>
                    </section>

                    {/* SSS / Bilgilendirme */}
                    <section className="pixel-section">
                      <Accordion type="single" collapsible>
                        <AccordionItem value="neler-var">
                          <AccordionTrigger>Bu uygulamada neler var?</AccordionTrigger>
                          <AccordionContent>
                            Dilek listesi, film ve müzik önerileri, ruh hali takibi ve daha fazlası.
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="nasil-kullanilir">
                          <AccordionTrigger>Nasıl kullanılır?</AccordionTrigger>
                          <AccordionContent>
                            Kartlardaki butonlarla ilgili sayfalara geçebilir, üstteki aksiyonlarla hızlıca işlem yapabilirsin.
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </section>
                  </div>
                } />
                
                {/* Informational pages */}
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/love-messages" element={<LoveMessagesPage />} />
                <Route path="/motivation" element={<DailyMotivationPage />} />
                <Route path="/movies" element={<MovieRecommendationsPage />} />
                <Route path="/mesafe-oyunu" element={<MesafeOyunuPage />} />
                <Route path="/mood-tracker" element={<MoodTrackerPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/music-playlist" element={<MusicPlaylistPage />} />
                <Route path="/surprise-notifications" element={<SurpriseNotificationsPage />} />
                <Route path="/bots" element={<BotsPage />} />

              </Routes>
            </div>


          </div>
      </SocketProvider>
  )
}

export default App
