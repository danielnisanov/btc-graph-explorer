// import { env } from '@/lib/env/client';

import type { BlockchainApiResponse } from '@/types/blockchain';

const BASE_URL = 'https://blockchain.info';

export class BlockchainApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'BlockchainApiError';
  }
}

export async function fetchAddressData(
  address: string,
  limit = 50, //When clicking on a node to expand, only the first N=50 transactions are loaded
  offset = 0
): Promise<BlockchainApiResponse> {
  try {
    // const url = `${BASE_URL}/rawaddr/${address}?limit=${limit}&offset=${offset}`;
    // Add CORS proxy for client-side requests
    const url = `${BASE_URL}/rawaddr/${address}?limit=${limit}&offset=${offset}&cors=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new BlockchainApiError(`Failed to fetch address data: ${response.statusText}`, response.status);
    }

    const data: BlockchainApiResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof BlockchainApiError) {
      throw error;
    }
    throw new BlockchainApiError('Network error or invalid address');
  }
}
