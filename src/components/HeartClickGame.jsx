import { useState, useEffect, useRef } from 'react'

const getRandomPosition = () => ({
  top: Math.random() * 60 + 10, // %
  left: Math.random() * 70 + 10 // %
})

const HeartClickGame = ({ onSuccess, onFail, difficulty = 0 }) => {
  const TOTAL_HEARTS = 10 + 2 * difficulty
  const GAME_TIME = Math.max(3, 7 - Math.min(3, difficulty))

  const [hearts, setHearts] = useState([])
  const [timeLeft, setTimeLeft] = useState(GAME_TIME)
  const [gameOver, setGameOver] = useState(false)
  const [result, setResult] = useState(null)
  const timerRef = useRef()

  useEffect(() => {
    setHearts(Array.from({ length: TOTAL_HEARTS }, (_, i) => ({ id: i, ...getRandomPosition() })))
    setTimeLeft(GAME_TIME)
    setGameOver(false)
    setResult(null)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [TOTAL_HEARTS, GAME_TIME])

  useEffect(() => {
    if (gameOver) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    if (timeLeft <= 0) {
      setGameOver(true)
      setResult('fail')
      if (timerRef.current) clearInterval(timerRef.current)
      setTimeout(() => onFail && onFail(), 1200)
    }
  }, [timeLeft, gameOver, onFail])

  const handleHeartClick = (id) => {
    setHearts(hs => {
      const newHearts = hs.filter(h => h.id !== id)
      if (newHearts.length === 0 && !gameOver) {
        setGameOver(true)
        setResult('success')
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeout(() => onSuccess && onSuccess(), 1200)
      }
      return newHearts
    })
  }

  return (
    <div className="heart-game-container">
      <h3 className="heart-game-title">💗 Hızlı Kalp Tıklama</h3>
      <p className="heart-game-desc">Tüm kalplere {GAME_TIME} saniye içinde tıkla!<br/>Zorluk: {difficulty + 1} | Kalp: {TOTAL_HEARTS}</p>
      <div className="heart-game-timer">Kalan Süre: <b>{Math.max(0, timeLeft)}</b> sn</div>
      <div className="heart-game-area">
        {hearts.map(h => (
          <div
            key={h.id}
            className="heart-game-heart"
            style={{ top: `${h.top}%`, left: `${h.left}%` }}
            onClick={() => handleHeartClick(h.id)}
          >
            ❤️
          </div>
        ))}
      </div>
      {gameOver && result === 'success' && (
        <div className="heart-game-result success">Başardın! 💖</div>
      )}
      {gameOver && result === 'fail' && (
        <div className="heart-game-result fail">Süre doldu! 😢</div>
      )}
    </div>
  )
}

export default HeartClickGame