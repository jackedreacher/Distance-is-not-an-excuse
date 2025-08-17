import Wishlist from '../components/Wishlist'

const WishlistPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">💕 Ortak Dileklerimiz 💕</h1>
        <p className="page-subtitle">Birlikte yapmak istediğimiz şeyleri planlayalım</p>
      </header>
      <Wishlist />
    </div>
  )
}

export default WishlistPage