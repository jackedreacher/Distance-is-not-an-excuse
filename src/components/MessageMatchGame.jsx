import { useState, useEffect } from 'react'

const ALL_MESSAGES = [
  'Sana bir aşk mektubu!',
  'Bir gül kadar güzelsin.',
  'Sincap gibi tatlısın.',
  'Kalbim hep seninle.',
  'Seninle her şey daha güzel.',
  'Gözlerin yıldız gibi parlıyor.',
  'Sana sarılmak en büyük mutluluk.',
  'Hayalimdeki tek kişi sensin.',
]

const getShuffledCards = (pairCount) => {
  const pairs = ALL_MESSAGES.slice(0, pairCount).map(msg => ({ img: '🐿️', msg }))
  const cards = [...pairs, ...pairs].map((pair, i) => ({
    id: i,
    img: pair.img,
    msg: pair.msg,
    matched: false,
  }))
  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

const MessageMatchGame = ({ onSuccess, onFail, difficulty = 0 }) => {
  const pairCount = Math.min(4 + difficulty, 8)
  const [cards, setCards] = useState(() => getShuffledCards(pairCount))
  const [flipped, setFlipped] = useState([]) // [index, index]
  const [matchedCount, setMatchedCount] = useState(0)
  const [tries, setTries] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (matchedCount === pairCount) {
      setGameOver(true)
      setResult('success')
      setTimeout(() => onSuccess && onSuccess(), 1200)
    } else if (tries >= 8) {
      setGameOver(true)
      setResult('fail')
      setTimeout(() => onFail && onFail(), 1200)
    }
  }, [matchedCount, tries, onSuccess, onFail, pairCount])

  const handleCardClick = (idx) => {
    if (gameOver || flipped.includes(idx) || cards[idx].matched) return
    if (flipped.length === 0) {
      setFlipped([idx])
    } else if (flipped.length === 1) {
      setFlipped([flipped[0], idx])
      setTimeout(() => {
        const [i1, i2] = [flipped[0], idx]
        if (cards[i1].msg === cards[i2].msg) {
          setCards(cs => cs.map((c, i) => (i === i1 || i === i2 ? { ...c, matched: true } : c)))
          setMatchedCount(c => c + 1)
        } else {
          setTries(t => t + 1)
        }
        setFlipped([])
      }, 900)
    }
  }

  return (
    <div className="message-match-container">
      <h3 className="message-match-title">🐿️ Mesaj Eşleştirme</h3>
      <p className="message-match-desc">Aynı sincap kartlarını eşleştir!<br/>Zorluk: {difficulty + 1} | Çift: {pairCount}</p>
      <div className="message-match-tries">Yanlış Deneme: <b>{tries}</b> / 8</div>
      <div className="message-match-grid">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className={`message-card-flip ${card.matched ? 'matched' : ''} ${flipped.includes(idx) ? 'flipped' : ''}`}
            onClick={() => handleCardClick(idx)}
          >
            <div className="message-card-inner">
              <div className="message-card-front">
                <span className="message-card-img">{card.img}</span>
              </div>
              <div className="message-card-back">{card.msg}</div>
            </div>
          </div>
        ))}
      </div>
      {gameOver && result === 'success' && (
        <div className="message-match-result success">Tebrikler, hepsini eşleştirdin! 💖</div>
      )}
      {gameOver && result === 'fail' && (
        <div className="message-match-result fail">Üzgünüm, deneme hakkın bitti! 😢</div>
      )}
    </div>
  )
}

export default MessageMatchGame