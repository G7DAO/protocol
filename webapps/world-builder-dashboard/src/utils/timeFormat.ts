export const timeAgo = (timestamp: number | undefined, short = false) => {
  if (!timestamp) {
    return ''
  }
  const now = new Date().getTime()
  const date = new Date(Number(timestamp) * 1000).getTime()
  const timeDifference = Math.floor((now - date) / 1000)

  const units = [
    { name: 'year', inSeconds: 60 * 60 * 24 * 365, shortName: 'y' },
    { name: 'month', inSeconds: 60 * 60 * 24 * 30, shortName: 'mo' },
    { name: 'day', inSeconds: 60 * 60 * 24, shortName: 'd' },
    { name: 'hour', inSeconds: 60 * 60, shortName: 'h' },
    { name: 'minute', inSeconds: 60, shortName: 'm' },
    { name: 'second', inSeconds: 1, shortName: 's' }
  ]

  for (const unit of units) {
    const value = Math.floor(timeDifference / unit.inSeconds)
    if (value >= 1) {
      return `${value}${short ? '' : ' '}${short ? unit.shortName : unit.name}${short ? '' : value > 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}

export const ETA = (timestamp: number | undefined, delayInSeconds: number | undefined, isApproximate = true) => {
  if (!timestamp || !delayInSeconds) {
    return 'N/A'
  }
  const now = Math.floor(new Date().getTime() / 1000)
  const date = Math.floor(Number(timestamp) + delayInSeconds)
  const timeDifference = ((date - now))
  if (timeDifference < 0) {
    return '~now' 
  }
  
  const units = [
    { name: 'year', inSeconds: 60 * 60 * 24 * 365 },
    { name: 'month', inSeconds: 60 * 60 * 24 * 30 },
    { name: 'day', inSeconds: 60 * 60 * 24 },
    { name: 'hour', inSeconds: 60 * 60 },
    { name: 'minute', inSeconds: 60 },
    { name: 'second', inSeconds: 1 }
  ]

  for (const unit of units) {
    const value = Math.floor(timeDifference / unit.inSeconds)
    if (value >= 1) {
      return `${isApproximate ? '~' : ''}${value} ${unit.name}${value > 1 ? 's' : ''}`
    }
  }
  return 'just now'
}


export const timeDifferenceInHoursAndMinutes = (start: number, end: number): string => {
  // Convert Unix timestamps to Date objects
  const startDate = new Date(start * 1000)
  const endDate = new Date(end * 1000)

  // Calculate the difference in milliseconds
  const diff = endDate.getTime() - startDate.getTime()

  // Convert the difference into hours and minutes
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  // Return the formatted difference
  return `${hours}h ${minutes}m`
}

export const timeDifferenceInHoursMinutesAndSeconds = (start: number, end: number): string => {
  // Convert Unix timestamps to Date objects
  const startDate = new Date(start * 1000)
  const endDate = new Date(end * 1000)

  // Calculate the difference in milliseconds
  const diff = endDate.getTime() - startDate.getTime()

  // Convert the difference into hours, minutes, and seconds
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  // Return the formatted difference
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
}
