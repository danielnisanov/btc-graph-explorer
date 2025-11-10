// Graph node representing a Bitcoin address
export interface GraphNode {
  id: string; // Bitcoin address
  label: string; // Shortened address for display
  balance?: number;
  totalReceived?: number;
  totalSent?: number;
  isExpanded: boolean;
  level: number; // Distance from root node
}

// Graph link representing a transaction
export interface GraphLink {
  source: string; // From address
  target: string; // To address
  value: number; // Amount in satoshis
  txHash: string; // Transaction hash
  timestamp?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
