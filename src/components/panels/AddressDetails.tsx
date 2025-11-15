'use client';

import { useMemo, useState, useEffect } from 'react';
import { useGraphStore } from '@/store/graphStore';
import type { GraphNode, GraphLink } from '@/types/graph';
import { fetchAddressData } from '@/services/blockchain/blockchainApi';
import { LoadMoreButton } from '@/components/ui/LoadMoreButton';

export function AddressDetails() {
  const selectedNodeId = useGraphStore((state) => state.selectedNode);
  const graphData = useGraphStore((state) => state.graphData);
  const loadingNodes = useGraphStore((state) => state.loadingNodes);
  const isNodeLoading = useGraphStore((state) => state.isNodeLoading);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const addNode = useGraphStore((state) => state.addNode);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Find the selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData.nodes]);

  // Auto-fetch balance if missing
  useEffect(() => {
    if (!selectedNode) return;

    const missingBalance = selectedNode.balance === undefined && selectedNode.totalReceived === undefined;

    if (missingBalance && !isFetchingBalance && !isNodeLoading(selectedNode.id)) {
      console.log('📊 Fetching balance for', selectedNode.id);
      setIsFetchingBalance(true);

      fetchAddressData(selectedNode.id, 0)
        .then((data) => {
          console.log('✅ Balance fetched:', data.final_balance);

          const updatedNode: GraphNode = {
            ...selectedNode,
            balance: data.final_balance,
            totalReceived: data.total_received,
            totalSent: data.total_sent,
            transactionCount: data.n_tx,
            loadedTransactions: selectedNode.loadedTransactions || 0,
            currentOffset: selectedNode.currentOffset || 0,
            hasMoreTransactions: selectedNode.hasMoreTransactions ?? true,
          };

          addNode(updatedNode);
          setIsFetchingBalance(false);
        })
        .catch((err) => {
          console.error('❌ Balance fetch failed:', err);
          setIsFetchingBalance(false);
        });
    }
  }, [selectedNode, isNodeLoading, isFetchingBalance, addNode]);

  // Get related transactions (incoming and outgoing)
  const relatedTransactions = useMemo(() => {
    if (!selectedNodeId) return { incoming: [], outgoing: [] };

    const incoming = graphData.links.filter((link) => link.target === selectedNodeId);
    const outgoing = graphData.links.filter((link) => link.source === selectedNodeId);

    return { incoming, outgoing };
  }, [selectedNodeId, graphData.links]);

  // Get connected addresses
  const connectedAddresses = useMemo(() => {
    if (!selectedNodeId) return [];

    const addressIds = new Set<string>();

    relatedTransactions.incoming.forEach((link) => {
      if (link.source !== selectedNodeId) {
        addressIds.add(link.source);
      }
    });

    relatedTransactions.outgoing.forEach((link) => {
      if (link.target !== selectedNodeId) {
        addressIds.add(link.target);
      }
    });

    return Array.from(addressIds)
      .map((id) => graphData.nodes.find((n) => n.id === id))
      .filter((n): n is GraphNode => n !== undefined);
  }, [selectedNodeId, relatedTransactions, graphData.nodes]);

  const formatBTC = (satoshis?: number) => {
    if (satoshis === undefined) return 'N/A';
    return (satoshis / 100000000).toFixed(8) + ' BTC';
  };

  const formatNumber = (num?: number) => {
    if (num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shortenAddress = (address: string, start = 8, end = 8) => {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No Address Selected</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Click on a node in the graph to view details</p>
        </div>
      </div>
    );
  }

  const isLoading = loadingNodes.has(selectedNode.id);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Address Details</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Selected node information</p>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear selection"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">ADDRESS</h3>
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading
              </span>
            )}
          </div>

          <div className="relative group">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <code className="text-xs font-mono text-gray-900 dark:text-white break-all">{selectedNode.id}</code>
            </div>
            <button
              onClick={() => copyToClipboard(selectedNode.id, 'address')}
              className="absolute right-2 top-2 p-1.5 bg-white dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 dark:hover:bg-gray-600"
              title="Copy address"
            >
              {copiedField === 'address' ? (
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Balance Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Balance Information</h3>

          <div className="grid grid-cols-1 gap-3">
            {/* Current Balance */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-green-700 dark:text-green-300 mb-1">Current Balance</div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {formatBTC(selectedNode.balance)}
              </div>
              {selectedNode.balance !== undefined && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ≈ ${((selectedNode.balance / 100000000) * 45000).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </div>
              )}
            </div>

            {/* Total Received */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Total Received</div>
              <div className="text-base font-semibold text-blue-900 dark:text-blue-100">
                {formatBTC(selectedNode.totalReceived)}
              </div>
            </div>

            {/* Total Sent */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-orange-700 dark:text-orange-300 mb-1">Total Sent</div>
              <div className="text-base font-semibold text-orange-900 dark:text-orange-100">
                {formatBTC(selectedNode.totalSent)}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Statistics */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Statistics</h3>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-2">
            {selectedNode.transactionCount !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatNumber(selectedNode.transactionCount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Incoming Transactions</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {relatedTransactions.incoming.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Outgoing Transactions</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {relatedTransactions.outgoing.length}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loaded Connections</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {relatedTransactions.incoming.length + relatedTransactions.outgoing.length}
              </span>
            </div>
          </div>
        </div>

        {/* Load More Button - Only show if node is expanded and has loaded some transactions */}
        {selectedNode.isExpanded && selectedNode.transactionCount !== undefined && selectedNode.transactionCount > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Load More Transactions</h3>
            <LoadMoreButton address={selectedNode.id} />
          </div>
        )}

        {/* Connected Addresses */}
        {connectedAddresses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Connected Addresses ({connectedAddresses.length})
            </h3>

            <div className="space-y-2">
              {connectedAddresses.slice(0, 10).map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono text-gray-900 dark:text-white block truncate">
                        {shortenAddress(node.id, 10, 10)}
                      </code>
                      {node.balance !== undefined && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatBTC(node.balance)}</div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {node.isExpanded ? (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      ) : (
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {connectedAddresses.length > 10 && (
                <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                  + {connectedAddresses.length - 10} more addresses
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {(relatedTransactions.incoming.length > 0 || relatedTransactions.outgoing.length > 0) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>

            <div className="space-y-2">
              {relatedTransactions.incoming.slice(0, 3).map((link, index) => (
                <div
                  key={`incoming-${link.txHash}-${link.source}-${index}`}
                  className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Incoming</span>
                  </div>
                  <div className="text-sm font-semibold text-green-900 dark:text-green-100">
                    {formatBTC(link.value)}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    From: {shortenAddress(link.source, 8, 6)}
                  </div>
                  {link.timestamp && (
                    <div className="text-xs text-green-500 dark:text-green-500 mt-1">{formatDate(link.timestamp)}</div>
                  )}
                </div>
              ))}

              {relatedTransactions.outgoing.slice(0, 3).map((link, index) => (
                <div
                  key={`outgoing-${link.txHash}-${link.target}-${index}`}
                  className="p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Outgoing</span>
                  </div>
                  <div className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    {formatBTC(link.value)}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    To: {shortenAddress(link.target, 8, 6)}
                  </div>
                  {link.timestamp && (
                    <div className="text-xs text-orange-500 dark:text-orange-500 mt-1">
                      {formatDate(link.timestamp)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => window.open(`https://blockchain.info/address/${selectedNode.id}`, '_blank')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View on Blockchain.info
          </button>
        </div>
      </div>
    </div>
  );
}
