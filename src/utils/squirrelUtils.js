// Random squirrel messages
export const squirrelMessages = [
  "Sürpriz! Seni seviyorum! 💕",
  "Seni çok özledim! 🥺",
  "Sen benim her şeyimsin! ✨",
  "Seni görmek için sabırsızlanıyorum! 🥰",
  "Kalbimi gülümsetiyorsun! 💖",
  "Hep seni düşünüyorum! 💭",
  "Sen benim favori kişimsin! 🌟",
  "Her gün seni daha çok seviyorum! 💝",
  "Sen benim güneşimsin! ☀️",
  "Gülümsemeni özledim! 😊",
  "Sen benim hayalimsin! 💫",
  "Sonsuza dek senin! 💕",
  "Sen benim mutluluğumsun! 🎉",
  "Seni aya kadar seviyorum! 🌙",
  "Sen benim mükemmel eşimsin! 💞"
]

// Get random squirrel message
export const getRandomSquirrelMessage = () => {
  return squirrelMessages[Math.floor(Math.random() * squirrelMessages.length)]
}

// Gift box interaction logic
export const handleGiftBoxInteraction = (giftBoxTaps, setGiftBoxTaps, setGiftBoxOpen, setSquirrelVisible, setSquirrelMessage) => {
  const newTaps = giftBoxTaps + 1
  setGiftBoxTaps(newTaps)
  
  if (newTaps >= 6) {
    // Get random message
    const randomMessage = getRandomSquirrelMessage()
    setSquirrelMessage(randomMessage)
    
    setGiftBoxOpen(true)
    setSquirrelVisible(true)
    setGiftBoxTaps(0)
    
    // Hide squirrel after 5 seconds
    setTimeout(() => {
      setSquirrelVisible(false)
      setGiftBoxOpen(false)
      setSquirrelMessage('')
    }, 5000)
  }
} 