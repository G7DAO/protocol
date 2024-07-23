export const timeAgo = (timestamp: number | undefined) => {
  if (!timestamp) {
    return ''
  }
  const now = new Date().getTime()
  const date = new Date(Number(timestamp) * 1000).getTime()
  const timeDifference = Math.floor((now - date) / 1000)

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
      return `${value} ${unit.name}${value > 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}

export const ETA = (timestamp: number, delayInSeconds: number) => {
  const now = new Date().getTime()
  const date = new Date(Number(timestamp) * 1000 + delayInSeconds * 1000).getTime()
  const timeDifference = Math.floor((date - now) / 1000)
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
      return `~${value} ${unit.name}${value > 1 ? 's' : ''}`
    }
  }
  return 'just now'
}
