import { useEffect, useRef } from 'react'

interface QueueItem {
  id: string
  execute: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
}

const MAX_CONCURRENT_REQUESTS = 10
let activeRequests = 0
let requestQueue: QueueItem[] = []

const processQueue = async () => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return
  }

  const item = requestQueue.shift()
  if (!item) return

  activeRequests++
  try {
    const result = await item.execute()
    item.resolve(result)
  } catch (error) {
    item.reject(error)
  } finally {
    activeRequests--
    processQueue() // Process next item in queue
  }
}

export const useRequestQueue = () => {
  const componentId = useRef(Math.random().toString(36).substr(2, 9))

  useEffect(() => {
    return () => {
      // Clean up any queued requests for this component when unmounting
      requestQueue = requestQueue.filter(item => item.id !== componentId.current)
    }
  }, [])

  const queueRequest = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (activeRequests < MAX_CONCURRENT_REQUESTS && requestQueue.length === 0) {
      activeRequests++
      try {
        return await fn()
      } finally {
        activeRequests--
        processQueue()
      }
    }

    return new Promise((resolve, reject) => {
      requestQueue.push({
        id: componentId.current,
        execute: fn,
        resolve,
        reject
      })
    })
  }

  return { queueRequest, activeRequests }
}