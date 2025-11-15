// src/hooks/useGraphData.ts - Data update logic for the graph

import { useEffect, useRef } from 'react';
import type { GraphData } from '@/types/graph';

type ForceGraphInstance = any;

export function useGraphData(
  graphRef: React.RefObject<ForceGraphInstance>,
  graphData: GraphData,
  isGraphReady: boolean
) {
  const previousNodeCountRef = useRef(0);

  useEffect(() => {
    if (!graphRef.current || !isGraphReady) return;

    const currentNodeCount = graphData.nodes.length;
    const previousNodeCount = previousNodeCountRef.current;
    const hasNewNodes = currentNodeCount > previousNodeCount;

    console.log('Updating graph:', { current: currentNodeCount, previous: previousNodeCount, hasNewNodes });

    // Update graph data
    graphRef.current.graphData(graphData);

    // Only settle simulation if new nodes added
    if (hasNewNodes) {
      console.log('New nodes detected - allowing simulation to settle');
      try {
        graphRef.current.cooldownTicks(30);
      } catch (e) {
        console.warn('cooldownTicks not available', e);
      }
    }

    previousNodeCountRef.current = currentNodeCount;

    // Auto-fit on first load
    if (previousNodeCount === 0 && currentNodeCount > 0) {
      setTimeout(() => {
        try {
          graphRef.current?.zoomToFit?.(400, 50);
        } catch (e) {
          console.error('Error during zoomToFit:', e);
        }
      }, 1500);
    }
  }, [graphData, isGraphReady]);
}
