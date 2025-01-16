import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers';

const BASE_URL = 'https://api.game7.build'

export const useFaucetAPI = () => {

  const useFaucetTimestamp = (address: string | undefined) => {
    const isValidAddress = ethers.utils.isAddress(address ?? "");
    return useQuery(
      ['faucetTimestamp', address],
      async () => {
        const res = await fetch(`${BASE_URL}/faucet/timestamp/${address}`, {
          method: 'GET',
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }
        const data = await res.json();
        return data.result;
      },
      {
        enabled: !!address && isValidAddress,
        retry: false,
      }
    );
  };


  const useFaucetInterval = () => {
    return useQuery(
      'faucetInterval',
      async () => {
        const res = await fetch(`${BASE_URL}/faucet/interval`, {
          method: 'GET',
        });
        if (!res.ok) {
          throw new Error(`Error: ${res.statusText}`);
        }
        const data = await res.json();
        return data.result;
      },
      {
        retry: false,
      }
    );
  };

  const useFaucetCountdown = (address: string) => {
    return useQuery(
      ['faucetCountdown', address],
      async () => {
        const res = await fetch(`${BASE_URL}/faucet/countdown/${address}`, {
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
    useFaucetTimestamp,
    useFaucetInterval,
    useFaucetCountdown,
  }
}
