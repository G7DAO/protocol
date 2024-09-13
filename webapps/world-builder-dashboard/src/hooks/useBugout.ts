import { useState } from 'react';
import dotenv from 'dotenv';

const useBugout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState(null);
  // dotenv.config();
  // const { BUGOUT_DEV_TOKEN } = process.env;

  const createPoolEntry = async (
    journal_id: string,
    address: string,
    blockchain: string,
    title: string,
    extra: object
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://spire.bugout.dev/journals/${journal_id}/entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer `
        },
        body: JSON.stringify({
          title,
          address,
          blockchain,
          extra
        })
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { createPoolEntry, loading, error, response };
};

export default useBugout;
