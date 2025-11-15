'use client';

import { BlockchainGraph } from '@/components/graph/BlockchainGraph';
import { AddressDetails } from '@/components/panels/AddressDetails';
import { ApiLogWindow } from '@/components/panels/ApiLogWindow';
import { SearchBar } from '@/components/SearchBar';
import { useBlockchainData } from '@/hooks/useBlockchainData';
import { useGraphStore } from '@/store/graphStore';

export default function HomePage() {
  const { loadInitialAddress, isLoading, error, clearError } = useBlockchainData();
  const graphData = useGraphStore((state) => state.graphData);

  const handleSearch = async (address: string) => {
    clearError();
    useGraphStore.getState().clearGraph();
    await loadInitialAddress(address);

    // Auto-select the searched address after loading
    setTimeout(() => {
      useGraphStore.getState().setSelectedNode(address);
    }, 500); // Small delay to let graph render
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-6 px-6 max-w-[1440px]">
        {/* Search Bar (top) */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} error={error} />
        </div>

        {/* Main Content Area */}
        <div className="mt-2">
          {graphData.nodes.length === 0 ? (
            // Empty state - show when no data loaded
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-16 text-center border border-slate-200/70 dark:border-slate-800">
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
            // Graph view with sidebar - GRID layout
            <div className="grid grid-cols-[360px_1fr] gap-6">
              {/* LEFT SIDEBAR: Address Details */}
              <aside
                className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
                style={{ minHeight: 'calc(100vh - 200px)' }}
              >
                <AddressDetails />
              </aside>

              {/* RIGHT SIDE: Graph */}
              <section
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
                style={{ minHeight: 'calc(100vh - 200px)' }}
              >
                {/* Graph stats header */}
                <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                        Transaction Network
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Showing {graphData.nodes.length} addresses and {graphData.links.length} transactions
                      </p>
                    </div>
                    <button
                      onClick={() => useGraphStore.getState().clearGraph()}
                      className="px-3.5 py-2 text-sm rounded-lg font-medium flex items-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200"
                    >
                      Clear Graph
                    </button>
                  </div>
                </div>

                {/* The Graph */}
                <div className="w-full p-6 h-[700px] flex items-center justify-center">
                  <BlockchainGraph width={1000} height={650} />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* API Log Window - Fixed at bottom */}
      <ApiLogWindow />
    </main>
  );
}
