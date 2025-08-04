// Set your reunion date here (YYYY, MM-1, DD)
// Note: Month is 0-indexed, so January is 0, February is 1, etc.
export const reunionDate = new Date(2026, 6, 13) // July 13, 2026 (July is month 6)

// Calculate time difference and return countdown values
export const calculateTimeDifference = () => {
  const now = new Date()
  const timeDiff = reunionDate - now
  
  if (timeDiff > 0) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
    
    return { days, hours, minutes, seconds }
  } else {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
}

// Format time unit with leading zero
export const formatTimeUnit = (value) => {
  return value.toString().padStart(2, '0')
} 