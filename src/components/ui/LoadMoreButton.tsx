'use client';

import { useBlockchainData } from '@/hooks/useBlockchainData';
import { useGraphStore } from '@/store/graphStore';

interface LoadMoreButtonProps {
  address: string;
  className?: string;
}

/**
 * Button component to load more transactions for an address
 * Shows progress and automatically hides when all transactions are loaded
 */
export function LoadMoreButton({ address, className = '' }: LoadMoreButtonProps) {
  const { loadMoreTransactions } = useBlockchainData();
  const graphData = useGraphStore((state) => state.graphData);
  const isLoading = useGraphStore((state) => state.loadingNodes.has(address));

  // Find the node for this address
  const node = graphData.nodes.find((n) => n.id === address);

  // Don't show button if node doesn't exist or has no more transactions
  if (!node || !node.hasMoreTransactions) {
    return null;
  }

  const handleLoadMore = () => {
    loadMoreTransactions(address);
  };

  const loadedCount = node.loadedTransactions || 0;
  const totalCount = node.transactionCount || 0;
  const remaining = totalCount - loadedCount;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${(loadedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Load More Button */}
      <button
        onClick={handleLoadMore}
        disabled={isLoading}
        className={`
          w-full px-4 py-2.5 rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            isLoading
              ? 'bg-blue-500/50 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]'
          }
          text-white
          flex items-center justify-center gap-2
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>
              Load More ({loadedCount}/{totalCount})
            </span>
          </>
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-center text-slate-400">
        {remaining} transaction{remaining !== 1 ? 's' : ''} remaining
      </p>
    </div>
  );
}
