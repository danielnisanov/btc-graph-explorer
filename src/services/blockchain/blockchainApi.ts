// lib/api/blockchainApi.ts (Updated version)

import type { BlockchainApiResponse } from '@/types/blockchain';

const BASE_URL = '/api/blockchain';

export class BlockchainApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'BlockchainApiError';
  }
}

/**
 * Fetch address data with automatic retry on rate limits
 */
export async function fetchAddressData(address: string, limit = 50, offset = 0): Promise<BlockchainApiResponse> {
  try {
    const url = `${BASE_URL}?address=${encodeURIComponent(address)}&limit=${limit}&offset=${offset}`;

    const response = await fetch(url);

    // Handle rate limiting
    if (response.status === 429) {
      const errorData = await response.json();
      const retryAfter = errorData.retryAfter || parseInt(response.headers.get('retry-after') || '60', 10);

      throw new BlockchainApiError(
        errorData.error || 'Too many requests. Please wait before trying again.',
        429,
        retryAfter
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new BlockchainApiError(
        errorData.error || `Failed to fetch address data: ${response.statusText}`,
        response.status
      );
    }

    const data: BlockchainApiResponse = await response.json();

    // Log cache status for debugging
    if (data.cached) {
      console.log(`✅ Data loaded from cache (${new Date(data.cacheTimestamp).toLocaleTimeString()})`);
    } else {
      console.log(`🌐 Data fetched from blockchain.info`);
    }

    return data;
  } catch (error) {
    if (error instanceof BlockchainApiError) {
      throw error;
    }
    throw new BlockchainApiError('Network error or invalid address');
  }
}

/**
 * Fetch with automatic retry after rate limit cooldown
 */
export async function fetchAddressDataWithRetry(
  address: string,
  limit = 50,
  offset = 0,
  onRetry?: (retryAfter: number) => void
): Promise<BlockchainApiResponse> {
  try {
    return await fetchAddressData(address, limit, offset);
  } catch (error) {
    if (error instanceof BlockchainApiError && error.statusCode === 429) {
      const retryAfter = error.retryAfter || 60;

      // Notify caller about retry
      if (onRetry) {
        onRetry(retryAfter);
      }

      console.log(`Rate limited. Retrying in ${retryAfter} seconds...`);

      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));

      // Retry once
      return await fetchAddressData(address, limit, offset);
    }

    throw error;
  }
}
