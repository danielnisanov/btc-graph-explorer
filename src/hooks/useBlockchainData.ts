import { useCallback, useState } from 'react';

import { BlockchainApiError, fetchAddressData } from '@/services/blockchain/blockchainApi';
import { useApiLogStore } from '@/store/apiLogStore';
import { useGraphStore } from '@/store/graphStore';

import type { GraphLink, GraphNode } from '@/types/graph';

// Configuration for how many transactions to load
const DEFAULT_TRANSACTION_LIMIT = 10;

export function useBlockchainData() {
  // Local state for tracking overall loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get actions from stores
  const { addNode, addNodes, addLinks, setNodeExpanded, setNodeLoading, isNodeLoading } = useGraphStore();
  const { addLog } = useApiLogStore();

  /**
   * Helper function to shorten Bitcoin address for display
   * Example: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" -> "1A1z...DivfNa"
   */
  const shortenAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  /**
   * Load blockchain data for a specific address and add it to the graph
   * This is the main function that fetches data and updates the graph
   */
  const loadAddressData = useCallback(
    async (address: string, level = 0, limit: number = DEFAULT_TRANSACTION_LIMIT) => {
      // Track if this specific node is already loading
      if (isNodeLoading(address)) {
        console.log(`Address ${address} is already loading, skipping...`);
        return;
      }

      // Mark this node as loading
      setNodeLoading(address, true);
      setIsLoading(true);
      setError(null);

      // Track start time for performance logging
      const startTime = Date.now();
      const requestUrl = `https://blockchain.info/rawaddr/${address}?limit=${limit}`;

      try {
        // Fetch data from blockchain API
        const data = await fetchAddressData(address, limit);

        // Calculate request duration
        const duration = Date.now() - startTime;

        // Log successful API call
        addLog({
          url: requestUrl,
          method: 'GET',
          status: 200,
          duration,
          response: {
            address: data.address,
            n_tx: data.n_tx,
            final_balance: data.final_balance,
            txs_count: data.txs.length,
          },
        });

        // Create the main node for this address
        const mainNode: GraphNode = {
          id: address,
          label: shortenAddress(address),
          balance: data.final_balance,
          totalReceived: data.total_received,
          totalSent: data.total_sent,
          isExpanded: false,
          level,
        };

        // Add main node to graph
        addNode(mainNode);

        // Extract related addresses and create nodes/links
        const relatedNodes: GraphNode[] = [];
        const links: GraphLink[] = [];

        // Set to track unique addresses we've already processed
        const processedAddresses = new Set<string>([address]);

        // Process transactions to find connected addresses
        data.txs.forEach((tx) => {
          // Process inputs (where money came FROM)
          tx.inputs.forEach((input) => {
            const inputAddr = input.prev_out.addr;

            // Skip if no address or if it's the main address
            if (!inputAddr || inputAddr === address) return;

            // Create node for input address if we haven't seen it yet
            if (!processedAddresses.has(inputAddr)) {
              relatedNodes.push({
                id: inputAddr,
                label: shortenAddress(inputAddr),
                isExpanded: false,
                level: level + 1,
              });
              processedAddresses.add(inputAddr);
            }

            // Create link: input address -> main address (money flow direction)
            links.push({
              source: inputAddr,
              target: address,
              value: input.prev_out.value,
              txHash: tx.hash,
              timestamp: tx.time,
            });
          });

          // Process outputs (where money went TO)
          tx.out.forEach((output) => {
            const outputAddr = output.addr;

            // Skip if no address or if it's the main address
            if (!outputAddr || outputAddr === address) return;

            // Create node for output address if we haven't seen it yet
            if (!processedAddresses.has(outputAddr)) {
              relatedNodes.push({
                id: outputAddr,
                label: shortenAddress(outputAddr),
                isExpanded: false,
                level: level + 1,
              });
              processedAddresses.add(outputAddr);
            }

            // Create link: main address -> output address (money flow direction)
            links.push({
              source: address,
              target: outputAddr,
              value: output.value,
              txHash: tx.hash,
              timestamp: tx.time,
            });
          });
        });

        // Add all related nodes and links to the graph at once
        addNodes(relatedNodes);
        addLinks(links);

        // Mark node as expanded after successful load
        setNodeExpanded(address, true);

        console.log(`Loaded ${relatedNodes.length} nodes and ${links.length} links for address ${address}`);
      } catch (err) {
        // Handle errors
        const duration = Date.now() - startTime;
        let errorMessage = 'Failed to load address data';

        if (err instanceof BlockchainApiError) {
          errorMessage = err.message;

          // Log failed API call
          addLog({
            url: requestUrl,
            method: 'GET',
            status: err.statusCode,
            duration,
            error: errorMessage,
          });
        } else {
          // Unknown error
          addLog({
            url: requestUrl,
            method: 'GET',
            duration,
            error: errorMessage,
          });
        }

        setError(errorMessage);
        console.error('Error loading address data:', err);
      } finally {
        // Always clean up loading state
        setNodeLoading(address, false);
        setIsLoading(false);
      }
    },
    [addNode, addNodes, addLinks, setNodeExpanded, setNodeLoading, isNodeLoading, addLog]
  );

  /**
   * Load initial address - this is called when user submits an address
   */
  const loadInitialAddress = useCallback(
    async (address: string) => {
      // Validate address format (basic check)
      if (!address || address.length < 26 || address.length > 35) {
        setError('Invalid Bitcoin address format');
        return;
      }

      // Load the root address at level 0
      await loadAddressData(address, 0);
    },
    [loadAddressData]
  );

  /**
   * Expand a node - load its connections
   */
  const expandNode = useCallback(
    async (address: string, currentLevel: number) => {
      await loadAddressData(address, currentLevel + 1);
    },
    [loadAddressData]
  );

  return {
    // State
    isLoading,
    error,

    // Actions
    loadInitialAddress,
    expandNode,

    // Helpers
    clearError: () => setError(null),
  };
}
