// src/hooks/useGraphInstance.ts - Graph initialization logic

import { useEffect, useRef, useState } from 'react';
import type { GraphNode } from '@/types/graph';

type ForceGraphInstance = any;

interface UseGraphInstanceProps {
  width: number;
  height: number;
  onNodeClick: (node: GraphNode) => void;
  getNodeColor: (node: GraphNode) => string;
  selectedNode: string | null;
  loadingNodes: Set<string>;
}

export function useGraphInstance({
  width,
  height,
  onNodeClick,
  getNodeColor,
  selectedNode,
  loadingNodes,
}: UseGraphInstanceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphInstance>(null);
  const [isGraphReady, setIsGraphReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || graphRef.current) {
      return;
    }

    import('force-graph')
      .then((ForceGraphModule) => {
        const ForceGraph = ForceGraphModule.default;

        if (!containerRef.current || graphRef.current) return;

        const graph = (ForceGraph as any)()(containerRef.current)
          .width(width)
          .height(height)
          .backgroundColor('#111827')
          .graphData({ nodes: [], links: [] });

        // Configure graph properties
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
            const maxValue = 100000000;
            const opacity = Math.min(link.value / maxValue, 0.8);
            return `rgba(59, 130, 246, ${Math.max(opacity, 0.2)})`;
          })
          .linkWidth((link: any) => {
            const maxValue = 100000000;
            const minWidth = 1;
            const maxWidth = 5;
            const width = (link.value / maxValue) * maxWidth;
            return Math.max(minWidth, Math.min(width, maxWidth));
          })
          .linkDirectionalArrowLength(6)
          .linkDirectionalArrowRelPos(1)
          .linkCurvature(0.2)
          .onNodeClick((node: any) => onNodeClick(node as GraphNode))
          .enableNodeDrag(true)
          .enableZoomInteraction(true)
          .enablePanInteraction(true)
          .cooldownTicks(100);

        // Configure forces
        try {
          const linkForce = graph.d3Force('link');
          if (linkForce) linkForce.distance(100).strength(0.5);

          const chargeForce = graph.d3Force('charge');
          if (chargeForce) chargeForce.strength(-300);

          const centerForce = graph.d3Force('center');
          if (centerForce) centerForce.strength(0.05);
        } catch (e) {
          console.error('Error configuring forces:', e);
        }

        // Simulation parameters
        graph.d3AlphaDecay(0.02);
        graph.d3VelocityDecay(0.3);
        graph.d3AlphaMin(0.001);

        graphRef.current = graph;
        setIsGraphReady(true);
      })
      .catch((err) => {
        console.error('Failed to load graph:', err);
      });

    return () => {
      if (graphRef.current) {
        graphRef.current._destructor?.();
        graphRef.current = null;
      }
    };
  }, [width, height]);

  return { containerRef, graphRef, isGraphReady };
}
