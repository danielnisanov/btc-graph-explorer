import { create } from 'zustand';

import type { GraphData, GraphLink, GraphNode } from '@/types/graph';

interface GraphState {
  graphData: GraphData;
  selectedNode: string | null;
  loadingNodes: Set<string>;

  // Actions
  addNode: (node: GraphNode) => void;
  addNodes: (nodes: GraphNode[]) => void;
  addLink: (link: GraphLink) => void;
  addLinks: (links: GraphLink[]) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setNodeExpanded: (nodeId: string, expanded: boolean) => void;
  setNodeLoading: (nodeId: string, loading: boolean) => void;
  isNodeLoading: (nodeId: string) => boolean;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  graphData: { nodes: [], links: [] },
  selectedNode: null,
  loadingNodes: new Set(),

  addNode: (node) =>
    set((state) => {
      const existingIndex = state.graphData.nodes.findIndex((n) => n.id === node.id);

      if (existingIndex >= 0) {
        // Node exists - MERGE the new data with existing data
        const updatedNodes = [...state.graphData.nodes];
        updatedNodes[existingIndex] = {
          ...updatedNodes[existingIndex], // Keep existing properties (level, isExpanded, etc.)
          ...node, // Merge in new properties (balance, totalReceived, totalSent)
        };

        return {
          graphData: {
            ...state.graphData,
            nodes: updatedNodes,
          },
        };
      }

      // Node doesn't exist - add it
      return {
        graphData: {
          ...state.graphData,
          nodes: [...state.graphData.nodes, node],
        },
      };
    }),

  addNodes: (nodes) =>
    set((state) => {
      const existingIds = new Set(state.graphData.nodes.map((n) => n.id));
      const newNodes = nodes.filter((n) => !existingIds.has(n.id));

      return {
        graphData: {
          ...state.graphData,
          nodes: [...state.graphData.nodes, ...newNodes],
        },
      };
    }),

  addLink: (link) =>
    set((state) => ({
      graphData: {
        ...state.graphData,
        links: [...state.graphData.links, link],
      },
    })),

  addLinks: (links) =>
    set((state) => ({
      graphData: {
        ...state.graphData,
        links: [...state.graphData.links, ...links],
      },
    })),

  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),

  setNodeExpanded: (nodeId, expanded) =>
    set((state) => ({
      graphData: {
        ...state.graphData,
        nodes: state.graphData.nodes.map((node) => (node.id === nodeId ? { ...node, isExpanded: expanded } : node)),
      },
    })),

  setNodeLoading: (nodeId, loading) =>
    set((state) => {
      const newLoadingNodes = new Set(state.loadingNodes);
      if (loading) {
        newLoadingNodes.add(nodeId);
      } else {
        newLoadingNodes.delete(nodeId);
      }
      return { loadingNodes: newLoadingNodes };
    }),

  isNodeLoading: (nodeId) => get().loadingNodes.has(nodeId),

  clearGraph: () =>
    set({
      graphData: { nodes: [], links: [] },
      selectedNode: null,
      loadingNodes: new Set(),
    }),
}));
