import MusicPlayer from '../components/MusicPlayer'

const MusicPlaylistPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">💕 Ortak Şarkılarımız 💕</h1>
        <p className="page-subtitle">Birlikte dinlediğimiz şarkıları ve anılarımızı saklayalım</p>
      </header>
      <MusicPlayer />
    </div>
  )
}

export default MusicPlaylistPage