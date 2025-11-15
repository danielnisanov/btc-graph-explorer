// src/components/graph/BlockchainGraph.tsx
'use client';

import { use, useCallback } from 'react';
import { useBlockchainData } from '@/hooks/useBlockchainData';
import { useGraphStore } from '@/store/graphStore';
import { GraphControls } from './GraphControls';
import { GraphLegend } from './GraphLegend';
import { GraphLoadingState } from './GraphLoadingState';
import { useGraphInstance } from '@/hooks/useGraphInstance';
import { useGraphData } from '@/hooks/useGraphData';
import { useGraphVisuals } from '@/hooks/useGraphVisuals';
import type { GraphNode } from '@/types/graph';

interface BlockchainGraphProps {
  width?: number;
  height?: number;
}

export function BlockchainGraph({ width = 1200, height = 600 }: BlockchainGraphProps) {
  const graphData = useGraphStore((state) => state.graphData);
  const selectedNode = useGraphStore((state) => state.selectedNode);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const loadingNodes = useGraphStore((state) => state.loadingNodes);
  const { expandNode } = useBlockchainData();

  const getNodeColor = useCallback(
    (node: GraphNode) => {
      if (loadingNodes.has(node.id)) return '#3b82f6';
      if (selectedNode === node.id) return '#10b981';
      if (node.isExpanded) return '#60a5fa';
      return '#9ca3af';
    },
    [selectedNode, loadingNodes]
  );

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node.id);
      if (!node.isExpanded && !loadingNodes.has(node.id)) {
        console.log(`Expanding node: ${node.id}`);
        expandNode(node.id, node.level);
      }
    },
    [setSelectedNode, loadingNodes, expandNode]
  );

  // Custom hooks handle all the complex logic
  const { containerRef, graphRef, isGraphReady } = useGraphInstance({
    width,
    height,
    onNodeClick: handleNodeClick,
    getNodeColor,
    selectedNode,
    loadingNodes,
  });

  useGraphData(graphRef, graphData, isGraphReady);
  useGraphVisuals(graphRef, selectedNode, loadingNodes, getNodeColor, isGraphReady);

  // Control handlers
  const handleFitToScreen = useCallback(() => {
    graphRef.current?.zoomToFit?.(400, 50);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.2, 200);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 0.8, 200);
    }
  }, []);

  const handleCenter = useCallback(() => {
    graphRef.current?.centerAt?.(0, 0, 500);
  }, []);


  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-slate-800" style={{ width, height }}>
      <div ref={containerRef} style={{ width, height }} />

      {isGraphReady && (
        <>
          <GraphControls
            onFit={handleFitToScreen}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onCenter={handleCenter}
          />
          <GraphLegend />
        </>
      )}
      {!isGraphReady && <GraphLoadingState />}
    </div>
  );
}
