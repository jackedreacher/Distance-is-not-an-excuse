import { handleGiftBoxInteraction } from '../utils/squirrelUtils'

const GiftBox = ({ 
  giftBoxTaps, 
  setGiftBoxTaps, 
  giftBoxOpen, 
  setGiftBoxOpen, 
  squirrelVisible, 
  setSquirrelVisible, 
  squirrelMessage, 
  setSquirrelMessage 
}) => {
  const handleTap = () => {
    handleGiftBoxInteraction(
      giftBoxTaps, 
      setGiftBoxTaps, 
      setGiftBoxOpen, 
      setSquirrelVisible, 
      setSquirrelMessage
    )
  }

  return (
    <>
      {/* Gift Box */}
      <div className="gift-box-container">
        <div 
          className={`gift-box ${giftBoxOpen ? 'open' : ''}`}
          onClick={handleTap}
        >
          <div className="gift-box-lid">
            {giftBoxOpen ? '🎁' : '🎁'}
          </div>
          <div className="gift-box-body">
            {giftBoxOpen ? '' : '🎁'}
          </div>
        </div>
      </div>
      
      {/* Squirrel Animation */}
      {squirrelVisible && (
        <div className="squirrel-container">
          <div className="squirrel-emerging">🐿️</div>
          <div className="squirrel-message">{squirrelMessage}</div>
        </div>
      )}
    </>
  )
}

export default GiftBox 