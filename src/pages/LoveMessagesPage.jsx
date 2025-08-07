import LoveMessages from '../components/LoveMessages'

const LoveMessagesPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">💌 Aşkımızın Mesajları</h1>
        <p className="page-subtitle">Birbirimize olan duygularımızı içeren özel mesajlar</p>
      </header>
      <div style={{ height: '100px' }}></div>
      <LoveMessages />
    </div>
  )
}

export default LoveMessagesPage