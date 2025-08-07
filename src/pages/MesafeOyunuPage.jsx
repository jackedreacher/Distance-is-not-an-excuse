import MesafeOyunu from '../components/MesafeOyunu'

const MesafeOyunuPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">💞 Mesafe Azaltma Oyunu</h1>
        <p className="page-subtitle">İki aşık arasındaki mesafeyi mini oyunlarla azalt!</p>
      </header>
      <MesafeOyunu />
    </div>
  )
}

export default MesafeOyunuPage