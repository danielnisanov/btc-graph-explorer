'use client';

import { BlockchainGraph } from '@/components/graph/BlockchainGraph';
import { SearchBar } from '@/components/SearchBar';
import { useBlockchainData } from '@/hooks/useBlockchainData';
import { useGraphStore } from '@/store/graphStore';

export default function HomePage() {
  // Get blockchain data hook
  const { loadInitialAddress, isLoading, error, clearError } = useBlockchainData();

  // Get graph data from store
  const graphData = useGraphStore((state) => state.graphData);

  /**
   * Handle address search
   * This is called when user submits an address in SearchBar
   */
  const handleSearch = async (address: string) => {
    // Clear any previous errors
    clearError();

    // Clear the graph before loading new address
    useGraphStore.getState().clearGraph();

    // Load the new address
    await loadInitialAddress(address);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} isLoading={isLoading} error={error} />

        {/* Graph Section */}
        <div className="mt-8">
          {graphData.nodes.length === 0 ? (
            // Empty state - show when no data loaded
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-16 text-center">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Ready to Explore</h3>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Enter a Bitcoin address above to visualize its transaction network. The graph will show incoming and
                outgoing transactions as an interactive network.
              </p>
              <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔍</span>
                  <span>Explore transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔗</span>
                  <span>Follow the money</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <span>Visualize patterns</span>
                </div>
              </div>
            </div>
          ) : (
            // Graph view - show when data is loaded
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Graph stats header */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Network</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Showing {graphData.nodes.length} addresses and {graphData.links.length} transactions
                    </p>
                  </div>
                  <button
                    onClick={() => useGraphStore.getState().clearGraph()}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Clear Graph
                  </button>
                </div>
              </div>

              {/* The Graph */}
              <div className="w-full p-4">
                <div className="mx-auto" style={{ maxWidth: '1200px' }}>
                  <BlockchainGraph width={1200} height={600} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
