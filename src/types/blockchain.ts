// Bitcoin address
export interface BitcoinAddress {
  address: string;
  total_received: number;
  total_sent: number;
  final_balance: number;
  n_tx: number;
}

// Bitcoin transaction
export interface BitcoinTransaction {
  hash: string;
  time: number;
  block_height?: number;
  inputs: TransactionInput[];
  out: TransactionOutput[];
  result?: number; // net effect on the address
}

export interface TransactionInput {
  prev_out: {
    addr?: string;
    value: number;
  };
}

export interface TransactionOutput {
  addr?: string;
  value: number;
  spent: boolean;
}

// API Response from blockchain.info
export interface BlockchainApiResponse {
  cacheTimestamp: string | number | Date;
  cached: any;
  address: string;
  n_tx: number;
  total_received: number;
  total_sent: number;
  final_balance: number;
  txs: BitcoinTransaction[];
}
