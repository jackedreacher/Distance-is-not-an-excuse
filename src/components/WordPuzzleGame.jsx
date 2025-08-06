import { useState } from 'react'

const WORDS = [
  { word: 'AŞK', hint: 'Seni bana bağlayan en güzel duygu.' },
  { word: 'KALP', hint: 'Sana ait olan, hep atan şey.' },
  { word: 'SEVGİ', hint: 'Her şeyin temeli, en güzel his.' },
  { word: 'BULUŞMA', hint: 'Hayalini kurduğumuz an.' },
  { word: 'ÖZLEMEK', hint: 'Seni düşündükçe içimi kaplayan his.' },
  { word: 'BERABERLİK', hint: 'En çok istediğimiz şey.' },
  { word: 'ROMANTİZM', hint: 'Her anı özel kılan şey.' },
  { word: 'GÜLÜMSEME', hint: 'Seninle her şey daha güzel.' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const WordPuzzleGame = ({ onSuccess, onFail, difficulty = 0 }) => {
  // Zorluk arttıkça daha uzun kelimelerden seç
  const filteredWords = WORDS.filter(w => w.word.length <= 3 + difficulty * 2)
  const [selected] = useState(() => filteredWords[Math.floor(Math.random() * filteredWords.length)])
  const [shuffled, setShuffled] = useState(() => shuffle(selected.word.split('')))
  const [input, setInput] = useState([])
  const [inputIdx, setInputIdx] = useState([])
  const [tries, setTries] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [result, setResult] = useState(null)

  const handleLetterClick = (letter, idx) => {
    if (gameOver || input.length >= selected.word.length) return
    setInput(inp => [...inp, letter])
    setInputIdx(idxArr => [...idxArr, idx])
    setShuffled(s => s.filter((_, i) => i !== idx))
  }

  const handleUndo = () => {
    if (input.length === 0 || gameOver) return
    setShuffled(s => {
      const lastIdx = inputIdx[inputIdx.length - 1]
      const lastLetter = input[input.length - 1]
      const newArr = [...s]
      newArr.splice(lastIdx, 0, lastLetter)
      return newArr
    })
    setInput(inp => inp.slice(0, -1))
    setInputIdx(idxArr => idxArr.slice(0, -1))
  }

  if (input.length === selected.word.length && !gameOver) {
    if (input.join('') === selected.word) {
      setGameOver(true)
      setResult('success')
      setTimeout(() => onSuccess && onSuccess(), 1200)
    } else {
      setTries(t => t + 1)
      if (tries + 1 >= 3) {
        setGameOver(true)
        setResult('fail')
        setTimeout(() => onFail && onFail(), 1200)
      } else {
        setTimeout(() => {
          setShuffled(s => {
            let arr = [...s]
            input.forEach((l, i) => {
              arr.splice(inputIdx[i], 0, l)
            })
            return arr
          })
          setInput([])
          setInputIdx([])
        }, 900)
      }
    }
  }

  return (
    <div className="word-puzzle-container">
      <h3 className="word-puzzle-title">🧩 Kelime Bulmaca</h3>
      <p className="word-puzzle-desc">Harflere tıklayarak doğru kelimeyi oluştur!</p>
      <div className="word-puzzle-hint">İpucu: <b>{selected.hint}</b></div>
      <div className="word-puzzle-tries">Yanlış Deneme: <b>{tries}</b> / 3</div>
      <div className="word-puzzle-input">
        {input.map((l, i) => (
          <span key={i} className="word-puzzle-letter filled">{l}</span>
        ))}
        {Array(selected.word.length - input.length).fill('').map((_, i) => (
          <span key={i + input.length} className="word-puzzle-letter empty">_</span>
        ))}
      </div>
      <div className="word-puzzle-letters">
        {shuffled.map((l, i) => (
          <button key={i} className="word-puzzle-btn" onClick={() => handleLetterClick(l, i)}>{l}</button>
        ))}
      </div>
      {input.length > 0 && !gameOver && (
        <button className="word-puzzle-undo-btn" onClick={handleUndo}>Geri Al</button>
      )}
      {gameOver && result === 'success' && (
        <div className="word-puzzle-result success">Tebrikler, doğru kelimeyi buldun! 💖</div>
      )}
      {gameOver && result === 'fail' && (
        <div className="word-puzzle-result fail">Üzgünüm, deneme hakkın bitti! 😢</div>
      )}
    </div>
  )
}

export default WordPuzzleGame