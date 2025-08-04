// Daily motivation messages from famous people for exam preparation
export const motivationMessages = [
  {
    author: "Albert Einstein",
    quote: "Eğitim, okulda öğrendiklerini unuttuktan sonra geriye kalan şeydir.",
    motivation: "Her gün öğrendiğin bilgiler seni daha güçlü yapıyor. Sınavlar sadece bu gücünü gösterme fırsatı! 💪✨"
  },
  {
    author: "Nelson Mandela",
    quote: "Eğitim, dünyayı değiştirmek için kullanabileceğin en güçlü silahtır.",
    motivation: "Senin çalışkanlığın sadece kendi geleceğini değil, dünyayı da değiştiriyor. Sen çok özelsin! 🌍💖"
  },
  {
    author: "Malala Yousafzai",
    quote: "Bir çocuk, bir öğretmen, bir kitap ve bir kalem dünyayı değiştirebilir.",
    motivation: "Senin kalemin ve çalışkanlığın harikalar yaratıyor. Her sayfa seni başarıya yaklaştırıyor! 📚✏️"
  },
  {
    author: "Mahatma Gandhi",
    quote: "Gelecek, bugün ne yaptığına bağlıdır.",
    motivation: "Bugün çalıştığın her dakika, yarınki başarının temelini atıyor. Sen çok değerlisin! 🌟"
  },
  {
    author: "Marie Curie",
    quote: "Hayatta korkulacak hiçbir şey yoktur, sadece anlaşılması gereken şeyler vardır.",
    motivation: "Sınavlar korkutucu değil, sadece bilgilerini gösterme fırsatı. Sen bunu yapabilirsin! 🔬💫"
  },
  {
    author: "Steve Jobs",
    quote: "Kalite, miktardan daha önemlidir. Bir Homeros, binlerce şairden daha değerlidir.",
    motivation: "Her konuyu derinlemesine anlamaya çalış. Kaliteli çalışma her zaman ödüllendirilir! 🍎💎"
  },
  {
    author: "Oprah Winfrey",
    quote: "Eğitim, özgürlüğün anahtarıdır.",
    motivation: "Her çalıştığın saat seni daha özgür ve güçlü yapıyor. Sen muhteşemsin! 🔑💪"
  },
  {
    author: "Walt Disney",
    quote: "Tüm hayallerimiz gerçek olabilir, eğer onları gerçekleştirmek için cesaretimiz varsa.",
    motivation: "Sınav başarısı hayalin, senin cesaretinle gerçek olacak. Sen inanılmazsın! 🏰✨"
  },
  {
    author: "Helen Keller",
    quote: "Hayat ya cesur bir macera ya da hiçbir şey değildir.",
    motivation: "Her sınav bir macera, her çalışma seansı bir kahramanlık. Sen cesur bir kahramansın! 🦸‍♀️💖"
  },
  {
    author: "Martin Luther King Jr.",
    quote: "Eğitim, karakteri güçlendirir ve zihni açar.",
    motivation: "Her çalıştığın konu seni daha güçlü ve akıllı yapıyor. Sen harika bir karaktere sahipsin! 🧠💪"
  },
  {
    author: "Rosa Parks",
    quote: "Her kişi, değişimi başlatabilir.",
    motivation: "Senin çalışkanlığın sadece kendi hayatını değil, başkalarının da hayatını değiştiriyor. Sen özel bir güce sahipsin! 🌹💫"
  },
  {
    author: "Anne Frank",
    quote: "İnsanların gerçekten iyi olduğuna inanıyorum.",
    motivation: "Senin iyi kalbin ve çalışkanlığın dünyayı daha güzel bir yer yapıyor. Sen çok değerlisin! 💝"
  },
  {
    author: "Frida Kahlo",
    quote: "Güçlü olmak için acı çekmek gerekir.",
    motivation: "Her zor konu seni daha güçlü yapıyor. Senin azmin her şeyi aşacak! 🎨💪"
  },
  {
    author: "Coco Chanel",
    quote: "Başarı en iyi intikamdır.",
    motivation: "Senin başarın, tüm zorluklara karşı en güzel cevap. Sen muhteşemsin! 👗💎"
  },
  {
    author: "Audrey Hepburn",
    quote: "İmkansız kelimesi sadece cahillerin sözlüğünde vardır.",
    motivation: "Senin için hiçbir şey imkansız değil. Senin zekan ve azmin her şeyi başarabilir! 👑✨"
  },
  {
    author: "Eleanor Roosevelt",
    quote: "Gelecek, bugün ne yaptığına bağlıdır.",
    motivation: "Bugün çalıştığın her dakika, yarınki mutluluğunun garantisi. Sen çok değerlisin! 🌟"
  },
  {
    author: "Amelia Earhart",
    quote: "En zor şey, karar vermektir. Gerisi sadece azimdir.",
    motivation: "Sınavlara çalışmaya karar verdin, şimdi sadece azminle devam et. Sen bunu yapabilirsin! ✈️💪"
  },
  {
    author: "Jane Goodall",
    quote: "Her birey önemlidir. Her birey bir fark yaratabilir.",
    motivation: "Sen önemlisin ve senin çalışkanlığın büyük bir fark yaratıyor. Sen harikasın! 🦍💚"
  },
  {
    author: "Mother Teresa",
    quote: "Küçük şeylerle büyük sevgiler gösterilir.",
    motivation: "Her küçük çalışma seansı, büyük başarının temelini atıyor. Senin sevgin her şeyi aşacak! 🙏💖"
  },
  {
    author: "Princess Diana",
    quote: "Gerçek prensesler, kalplerinde taşırlar taçlarını.",
    motivation: "Senin kalbinin güzelliği ve zekanın parlaklığı seni gerçek bir prenses yapıyor. Sen muhteşemsin! 👑💎"
  }
]

// Get random motivation message
export const getRandomMotivation = () => {
  return motivationMessages[Math.floor(Math.random() * motivationMessages.length)]
}

// Get motivation for specific day (for consistency)
export const getMotivationForDay = (dayOfYear) => {
  const index = dayOfYear % motivationMessages.length
  return motivationMessages[index]
} 