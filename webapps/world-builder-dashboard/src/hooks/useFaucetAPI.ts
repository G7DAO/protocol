import { useState, useCallback } from 'react'

const BASE_URL = 'https://api.game7.build'

export const useFaucetAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<Record<string, any> | null>(null)

  const getFaucetTimestamp = useCallback(async (address: string | undefined) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/api/faucet/timestamp/${address}`, {
        method: 'GET',
      })

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`)
      }

      const data = await res.json()
      setResponse(data.result)
      return data.result
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getFaucetInterval = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/api/faucet/interval`, {
        method: 'GET',
      })

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`)
      }

      const data = await res.json()
      setResponse(data.result)
      return data.result
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const getFaucetCountdown = useCallback(async (address: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/api/faucet/countdown/${address}`, {
        method: 'GET',
      })

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`)
      }

      const data = await res.json()
      setResponse(data.result)
      return data.result
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    response,
    getFaucetTimestamp,
    getFaucetInterval,
    getFaucetCountdown,
  }
}
