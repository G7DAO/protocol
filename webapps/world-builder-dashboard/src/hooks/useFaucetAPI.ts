import { useState, useCallback } from 'react'
import { useQuery } from 'react-query'

const BASE_URL = 'https://api.game7.build'

export const useFaucetAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<Record<string, any> | null>(null)

  const getFaucetTimestamp = (address: string | undefined) => {
    return useQuery(
      ['faucetTimestamp', address],
      async () => {
        const res = await fetch(`${BASE_URL}/api/faucet/timestamp/${address}`, {
          method: 'GET',
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }
        const data = await res.json();
        return data.result;
      },
      {
        enabled: !!address, // only run if address exists
        retry: false, // disables retry on failure
      }
    );
  };


  const getFaucetInterval = () => {
    return useQuery(
      'faucetInterval',
      async () => {
        const res = await fetch(`${BASE_URL}/api/faucet/interval`, {
          method: 'GET',
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }
        const data = await res.json();
        return data.result;
      },
      {
        retry: false, // disables retry on failure
      }
    );
  };

  const getFaucetCountdown = (address: string) => {
    return useQuery(
      ['faucetCountdown', address],
      async () => {
        const res = await fetch(`${BASE_URL}/api/faucet/countdown/${address}`, {
          method: 'GET',
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }
        const data = await res.json();
        return data.result;
      },
      {
        enabled: !!address,
        retry: false,
      }
    );
  };

  return {
    loading,
    error,
    response,
    getFaucetTimestamp,
    getFaucetInterval,
    getFaucetCountdown,
  }
}
