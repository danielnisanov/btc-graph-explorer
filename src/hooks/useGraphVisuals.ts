// src/hooks/useGraphVisuals.ts - Color/size update logic for graph

import { useEffect, useRef } from 'react';
import type { GraphNode } from '@/types/graph';

type ForceGraphInstance = any;

export function useGraphVisuals(
  graphRef: React.RefObject<ForceGraphInstance>,
  selectedNode: string | null,
  loadingNodes: Set<string>,
  getNodeColor: (node: GraphNode) => string,
  isGraphReady: boolean
) {
  const previousSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!graphRef.current || !isGraphReady) return;

    console.log('Updating node colors only');

    // Update colors
    graphRef.current.nodeColor(getNodeColor);

    // Auto-zoom to selected node
    if (selectedNode && selectedNode !== previousSelectedRef.current) {
      console.log(`Focusing on selected node: ${selectedNode}`);
      setTimeout(() => {
        if (graphRef.current) {
          graphRef.current.zoom(1.5, 500);
        }
      }, 200);
      previousSelectedRef.current = selectedNode;
    }
  }, [selectedNode, loadingNodes, getNodeColor, isGraphReady]);
}
