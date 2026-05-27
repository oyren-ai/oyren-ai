import { useCallback, useEffect, useState } from 'react';
import { creditApi, CreditBalance } from '@/api/creditApi';
import { useAuth } from '@/contexts/AuthContext';

export function useCredits() {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await creditApi.getBalance();
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credits');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { balance, isLoading, error, refetch: fetchCredits };
}