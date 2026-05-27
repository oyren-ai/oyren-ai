import { useEffect, useState } from 'react'
import { Coins, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { creditApi, type CreditBalance as CreditBalanceType } from '@/api/creditApi'

interface CreditBalanceProps {
  variant?: 'compact' | 'full'
  className?: string
}

export function CreditBalance({ variant = 'compact', className = '' }: CreditBalanceProps) {
  const { isAuthenticated } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCredits()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Refetch when Marker (or other) conversion deducts credits (Vorashil: credit system should auto-update after scan)
  useEffect(() => {
    if (!isAuthenticated) return
    const onRefresh = () => fetchCredits()
    window.addEventListener('credits-should-refresh', onRefresh)
    return () => window.removeEventListener('credits-should-refresh', onRefresh)
  }, [isAuthenticated])

  async function fetchCredits() {
    try {
      setLoading(true)
      setError(null)
      
      const data = await creditApi.getBalance()
      setCredits(data.credits)
    } catch (err) {
      console.error('Error fetching credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to load credits')
    } finally {
      setLoading(false)
    }
  }

  // Don't show if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        {variant === 'full' && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </span>
        )}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-500" />
        {variant === 'full' && (
          <span className="text-sm text-red-500">Error</span>
        )}
      </div>
    )
  }

  // Compact variant (for sidebar)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 ${className}`}>
        <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          {credits ?? '...'} Credits
        </span>
      </div>
    )
  }

  // Full variant
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Credits
        </span>
      </div>
      <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
        {credits ?? '...'} Credits
      </span>
    </div>
  )
}

