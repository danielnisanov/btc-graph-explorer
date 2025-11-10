'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlockchainData } from '@/hooks/useBlockchainData';
import { useGraphStore } from '@/store/graphStore';
import type { GraphLink, GraphNode } from '@/types/graph';

interface BlockchainGraphProps {
  width?: number;
  height?: number;
}

export function BlockchainGraph({ width = 1200, height = 600 }: BlockchainGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [isGraphReady, setIsGraphReady] = useState(false);

  // Get graph data and selected node from store
  const graphData = useGraphStore((state) => state.graphData);
  const selectedNode = useGraphStore((state) => state.selectedNode);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const loadingNodes = useGraphStore((state) => state.loadingNodes);

  // Get blockchain data hook for expanding nodes
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

  // Initialize graph
  useEffect(() => {
    console.log('=== GRAPH INITIALIZATION ATTEMPT ===');
    console.log('typeof window:', typeof window);
    console.log('containerRef.current:', !!containerRef.current);
    console.log('graphRef.current (existing):', !!graphRef.current);
    if (typeof window === 'undefined') {
      console.log('❌ Window is undefined - SSR mode');
      return;
    }

    if (!containerRef.current) {
      console.log('❌ Container ref not available');
      return;
    }

    if (graphRef.current) {
      console.log('✅ Graph already exists, skipping initialization');
      return;
    }

    console.log('✅ All checks passed, importing force-graph...');


    // Dynamically import force-graph (client-side only)
    import('force-graph')
      .then((ForceGraphModule) => {
        const ForceGraph = ForceGraphModule.default;

        if (!containerRef.current || graphRef.current) return;

        // Create graph instance
        const graph = ForceGraph()(containerRef.current)
          .width(width)
          .height(height)
          .backgroundColor('#111827')
          .graphData({ nodes: [], links: [] }); // Start with empty
        console.log('✅ Graph instance created:', !!graph);

        // Configure all the properties...
        graph
          .nodeLabel((node: any) => {
            const n = node as GraphNode;
            const parts = [
              `Address: ${n.label}`,
              n.balance !== undefined ? `Balance: ${(n.balance / 100000000).toFixed(8)} BTC` : null,
              n.isExpanded ? '✓ Expanded' : '○ Click to expand',
              loadingNodes.has(n.id) ? '⏳ Loading...' : null,
            ];
            return parts.filter(Boolean).join('\n');
          })

          .nodeColor((node: any) => getNodeColor(node as GraphNode))
          .nodeRelSize(8)
          .nodeVal((node: any) => {
            const n = node as GraphNode;
            if (selectedNode === n.id) return 15;
            if (loadingNodes.has(n.id)) return 12;
            return 10;
          })
          .linkSource('source')
          .linkTarget('target')
          .linkColor((link: any) => {
            const l = link as GraphLink;
            const maxValue = 100000000;
            const opacity = Math.min(l.value / maxValue, 0.8);
            return `rgba(59, 130, 246, ${Math.max(opacity, 0.2)})`;
          })
          .linkWidth((link: any) => {
            const l = link as GraphLink;
            const maxValue = 100000000;
            const minWidth = 1;
            const maxWidth = 5;
            const width = (l.value / maxValue) * maxWidth;
            return Math.max(minWidth, Math.min(width, maxWidth));
          })
          .linkDirectionalArrowLength(6)
          .linkDirectionalArrowRelPos(1)
          .linkCurvature(0.2)
          .onNodeClick((node: any) => {
            const n = node as GraphNode;
            setSelectedNode(n.id);
            if (!n.isExpanded && !loadingNodes.has(n.id)) {
              console.log(`Expanding node: ${n.id}`);
              expandNode(n.id, n.level);
            }
          })
          .enableNodeDrag(true)
          .enableZoomInteraction(true)
          .enablePanInteraction(true);
        console.log('✅ Graph configured');
        try{
          // Configure d3 forces separately
          const linkForce = graph.d3Force('link');
          if (linkForce) {
            linkForce.distance(100);
            console.log('✅ Link force configured');

          }

          const chargeForce = graph.d3Force('charge');
          if (chargeForce) {
            chargeForce.strength(-300);
            console.log('✅ Charge force configured');
          }

          const centerForce = graph.d3Force('center');
          if (centerForce) {
            centerForce.strength(0.05);
            console.log('✅ Center force configured');
          }
        } catch (e) {
          console.error('❌Error configuring forces:', e);
        }

        graphRef.current = graph;
        console.log('✅ graphRef.current assigned:', !!graphRef.current);

        setIsGraphReady(true);
        console.log('✅ Graph initialization complete! isGraphReady set to true');
      })
      .catch((err) => {
        console.error('❌ Failed to load graph:', err);
      });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up graph...');
      if (graphRef.current) {
        graphRef.current._destructor?.();
        graphRef.current = null;
      }
    };
  // }, [width, height, expandNode, setSelectedNode, loadingNodes, selectedNode]);
  }, [width, height]);

  // Update graph data
  useEffect(() => {
    if (!graphRef.current || !isGraphReady) {
      console.log('Graph not ready:', { graphRef: !!graphRef.current, isGraphReady });
      return;
    }
    console.log('=== BEFORE UPDATE ===');
    console.log('Current graph data:', graphRef.current.graphData());
    console.log('Updating graph with data:', {
      nodes: graphData.nodes.length,
      links: graphData.links.length,
    });

    // CRITICAL: force-graph needs a NEW object reference to detect changes
    // Create a deep copy of the data
    const graphDataCopy = {
      nodes: [...graphData.nodes],
      links: [...graphData.links],
    };

    // Set the graph data with the new reference
    graphRef.current.graphData(graphDataCopy);

    // Force node colors to update after data change
    graphRef.current.nodeColor(graphRef.current.nodeColor());

    // Zoom to fit after data loads
    if (graphData.nodes.length > 0) {
      setTimeout(() => {
        try {
          graphRef.current?.zoomToFit?.(400, 50);
        } catch (e) {
          console.error('Error during zoomToFit:', e);
        }
      }, 500);
    }
  }, [graphData, isGraphReady]);

  // Update node colors when selection changes
  useEffect(() => {
    if (!graphRef.current || !isGraphReady) return;

    console.log('Updating node colors');

    // Update the color function
    const colorFunc = (node: any) => getNodeColor(node as GraphNode);
    graphRef.current.nodeColor(colorFunc);

    // Force refresh by calling nodeColor with itself
    // This triggers a re-render in force-graph
    graphRef.current.nodeColor(graphRef.current.nodeColor());
  }, [selectedNode, loadingNodes, getNodeColor, isGraphReady]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ width, height }}>
      <div ref={containerRef} style={{ width, height }} />
      {/* Controls */}
      {isGraphReady && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-2">
          <button onClick={() => graphRef.current?.zoomToFit?.(400, 50)} className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            🔍 Fit
          </button>
          <button onClick={() => graphRef.current?.zoom?.(graphRef.current.zoom() * 1.2, 200)} className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            ➕
          </button>
          <button onClick={() => graphRef.current?.zoom?.(graphRef.current.zoom() * 0.8, 200)} className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            ➖
          </button>
          <button onClick={() => graphRef.current?.centerAt?.(0, 0, 500)} className="w-full px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
            🎯
          </button>
        </div>
      )}

      {/* Legend */}
      {isGraphReady && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 text-sm max-w-xs">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Legend</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 text-xs">Unexpanded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-gray-700 dark:text-gray-300 text-xs">Expanded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-700 dark:text-gray-300 text-xs">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-gray-700 dark:text-gray-300 text-xs">Loading</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {!isGraphReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-white">Loading graph...</p>
          </div>
        </div>
      )}
    </div>
  );
}
