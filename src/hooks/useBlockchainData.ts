import { useCallback, useState } from 'react';

import { BlockchainApiError, fetchAddressData } from '@/services/blockchain/blockchainApi';
import { useApiLogStore } from '@/store/apiLogStore';
import { useGraphStore } from '@/store/graphStore';

import type { GraphLink, GraphNode } from '@/types/graph';

// Configuration for how many transactions to load per request
const DEFAULT_TRANSACTION_LIMIT = 10;

export function useBlockchainData() {
  // Local state for tracking overall loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get actions from stores
  const { addNode, addNodes, addLinks, setNodeExpanded, setNodeLoading, isNodeLoading, updateNodePagination, getNode } =
    useGraphStore();
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
   *
   * @param address - Bitcoin address to load
   * @param level - Graph level (distance from root)
   * @param limit - Number of transactions to load
   * @param offset - Offset for pagination (0 for first load)
   * @param isLoadMore - Whether this is a "load more" request (appends data)
   */
  const loadAddressData = useCallback(
    async (
      address: string,
      level = 0,
      limit: number = DEFAULT_TRANSACTION_LIMIT,
      offset: number = 0,
      isLoadMore: boolean = false
    ) => {
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
      const requestUrl = `https://blockchain.info/rawaddr/${address}?limit=${limit}&offset=${offset}`;

      try {
        // Fetch data from blockchain API
        const data = await fetchAddressData(address, limit, offset);

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
            offset,
          },
        });

        // On first load, create/update the main node with full details
        if (!isLoadMore) {
          const mainNode: GraphNode = {
            id: address,
            label: shortenAddress(address),
            balance: data.final_balance,
            totalReceived: data.total_received,
            totalSent: data.total_sent,
            transactionCount: data.n_tx, // Total transactions for this address
            isExpanded: false,
            level,
            loadedTransactions: data.txs.length,
            currentOffset: offset + data.txs.length,
            hasMoreTransactions: offset + data.txs.length < data.n_tx,
          };

          // Add main node to graph
          addNode(mainNode);
        } else {
          // On load more, just update pagination state
          updateNodePagination(address, {
            loadedTransactions: (getNode(address)?.loadedTransactions ?? 0) + data.txs.length,
            currentOffset: offset + data.txs.length,
            hasMoreTransactions: offset + data.txs.length < data.n_tx,
          });
        }

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
                loadedTransactions: 0,
                currentOffset: 0,
                hasMoreTransactions: true,
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
                loadedTransactions: 0,
                currentOffset: 0,
                hasMoreTransactions: true,
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

        // Mark node as expanded after successful load (only on first load)
        if (!isLoadMore) {
          setNodeExpanded(address, true);
        }

        console.log(`
📊 Loaded data for ${address}
   Transactions: ${data.txs.length}
   Offset: ${offset}
   Loaded: ${offset + data.txs.length}/${data.n_tx}
   New Nodes: ${relatedNodes.length}
   New Links: ${links.length}
   Has More: ${offset + data.txs.length < data.n_tx}
        `);
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
    [addNode, addNodes, addLinks, setNodeExpanded, setNodeLoading, isNodeLoading, updateNodePagination, getNode, addLog]
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
      await loadAddressData(address, 0, DEFAULT_TRANSACTION_LIMIT, 0, false);
    },
    [loadAddressData]
  );

  /**
   * Expand a node - load its first batch of transactions
   */
  const expandNode = useCallback(
    async (address: string, currentLevel: number) => {
      await loadAddressData(address, currentLevel + 1, DEFAULT_TRANSACTION_LIMIT, 0, false);
    },
    [loadAddressData]
  );

  /**
   * Load more transactions for an already-expanded node
   */
  const loadMoreTransactions = useCallback(
    async (address: string) => {
      const node = getNode(address);

      if (!node) {
        console.error(`Node ${address} not found`);
        return;
      }

      if (!node.hasMoreTransactions) {
        console.log(`No more transactions for ${address}`);
        return;
      }

      // Load next batch using current offset
      await loadAddressData(
        address,
        node.level,
        DEFAULT_TRANSACTION_LIMIT,
        node.currentOffset,
        true // isLoadMore = true
      );
    },
    [loadAddressData, getNode]
  );

  return {
    // State
    isLoading,
    error,

    // Actions
    loadInitialAddress,
    expandNode,
    loadMoreTransactions, // New function for pagination

    // Helpers
    clearError: () => setError(null),
  };
}
