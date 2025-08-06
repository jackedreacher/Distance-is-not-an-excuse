import { useState } from 'react'
import HeartClickGame from './HeartClickGame'
import MessageMatchGame from './MessageMatchGame'
import WordPuzzleGame from './WordPuzzleGame'

const TOTAL_STEPS = 10 // 1000km / 100km
const GAMES_PER_STEP = 3

const MesafeOyunu = () => {
  const [progress, setProgress] = useState(0) // 0-10, her biri 100km
  const [miniStep, setMiniStep] = useState(0) // 0: kalp, 1: eşleştirme, 2: kelime
  const [gameActive, setGameActive] = useState(false)
  const [celebration, setCelebration] = useState(false)
  const [failMsg, setFailMsg] = useState('')
  const [miniGamesInCycle, setMiniGamesInCycle] = useState(0)

  const distance = (TOTAL_STEPS - progress) * 100
  const difficulty = progress // 0-10 arası, her 100km'de bir artar

  const handleMiniGameSuccess = () => {
    if (miniStep < 2) {
      setMiniStep(miniStep + 1)
      setMiniGamesInCycle(n => n + 1)
      setGameActive(true)
      setFailMsg('')
    } else {
      // 3. mini oyun bitti, bir döngü tamamlandı
      const newProgress = progress + 1
      setProgress(newProgress)
      setMiniStep(0)
      setMiniGamesInCycle(0)
      setGameActive(false)
      setFailMsg('')
      if (newProgress >= TOTAL_STEPS) {
        setCelebration(true)
      }
    }
  }

  const handleMiniGameFail = () => {
    setGameActive(false)
    setFailMsg('Üzgünüm, bu sefer olmadı! Tekrar deneyebilirsin.')
  }

  const startMiniGame = () => {
    setGameActive(true)
    setCelebration(false)
    setFailMsg('')
    setMiniStep(0)
    setMiniGamesInCycle(0)
  }

  return (
    <div className="mesafe-oyunu-container">
      <h2 className="mesafe-title">💞 Mesafe Azaltma Oyunu</h2>
      <p className="mesafe-desc">
        İki aşık arasındaki mesafeyi mini oyunlarla azalt!<br/>
        Her 3 oyunda bir 100 km azalır.<br/>
        Zorluk: {difficulty + 1} / {TOTAL_STEPS + 1}
      </p>
      <div className="mesafe-display">
        <span className="mesafe-label">Kalan Mesafe:</span>
        <span className="mesafe-value">{distance} km</span>
      </div>
      {!celebration && !gameActive && distance > 0 && (
        <button className="mini-game-btn" onClick={startMiniGame}>
          Mini Oyun Oyna
        </button>
      )}
      {gameActive && miniStep === 0 && (
        <HeartClickGame onSuccess={handleMiniGameSuccess} onFail={handleMiniGameFail} difficulty={difficulty} />
      )}
      {gameActive && miniStep === 1 && (
        <MessageMatchGame onSuccess={handleMiniGameSuccess} onFail={handleMiniGameFail} difficulty={difficulty} />
      )}
      {gameActive && miniStep === 2 && (
        <WordPuzzleGame onSuccess={handleMiniGameSuccess} onFail={handleMiniGameFail} difficulty={difficulty} />
      )}
      {failMsg && !gameActive && (
        <div className="heart-game-result fail">{failMsg}</div>
      )}
      {celebration && (
        <div className="celebration-message">
          <div className="celebration-anim">🎉💖🎉</div>
          <h3>Tebrikler! Artık aranızda mesafe kalmadı, buluştunuz! 💑</h3>
        </div>
      )}
    </div>
  )
}

export default MesafeOyunu