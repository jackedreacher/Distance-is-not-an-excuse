import { useEffect, useState } from 'react'
import IconLeft from '../assets/Untitled design (2).svg'
import IconRight from '../assets/Untitled design (1).svg'

// İki figür merkeze yaklaşır, ortada buluşur; geçerken başlık merkezden dışa doğru değişir; en sonda kalp belirir ve figürler başlığın üstüne yerleşir.
export default function TogetherApproach({ duration = 9000 }) {
  const [stage, setStage] = useState('countdown') // 'countdown' | 'reveal'
  const [met, setMet] = useState(false)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const revealDelay = Math.max(0, Math.round(duration * 0.44));
    const t0 = setTimeout(() => setStage('reveal'), revealDelay);
    const t1 = setTimeout(() => setMet(true), duration);
    const t2 = setTimeout(() => setSettled(true), duration + 500);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [duration])

  return (
    <div
      className={`approach-hero ${stage === 'reveal' ? 'reveal' : ''} ${met ? 'met' : ''} ${settled ? 'settled' : ''}`}
      style={{
        '--approach-duration': `${duration}ms`,
        '--waddle-duration': '900ms',
        '--reveal-duration': 'calc(var(--approach-duration) * 0.52)',
        '--meet-gap': '0px',
      }}
    >
      {/* Sol figür */}
      <div className={`figure left ${met ? 'met' : ''} ${settled ? 'settle-left' : ''}`} aria-hidden>
        <div className={`figure-inner ${met ? 'met' : ''}`}>
          <img src={IconLeft} alt="Sol figür" />
        </div>
      </div>

      {/* Başlık ve geçiş efekti */}
      <div className="title-stack">
        <h1 className="title">
          <span className="title-piece title-old">Birbirimize Geri Sayım</span>
          <span className="title-piece title-new">Daima Birlikte</span>
        </h1>
      </div>

      {/* Sağ figür */}
      <div className={`figure right ${met ? 'met' : ''} ${settled ? 'settle-right' : ''}`} aria-hidden>
        <div className={`figure-inner ${met ? 'met' : ''}`}>
          <img src={IconRight} alt="Sağ figür" />
        </div>
      </div>

      {/* Kalp */}
      <div className="center-heart" aria-hidden>💖</div>
    </div>
  )
}