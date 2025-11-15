import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from '@/store/graphStore';
import type { GraphNode, GraphLink } from '@/types/graph';

const baseNode = (id: string, extra: Partial<GraphNode> = {}): GraphNode => ({
  id,
  label: id,
  level: 0,
  isExpanded: false,
  loadedTransactions: 0,
  currentOffset: 0,
  hasMoreTransactions: true,
  ...extra,
});

const link = (source: string, target: string, txHash: string): GraphLink => ({
  source,
  target,
  txHash,
  value: 1,
});

describe('useGraphStore', () => {
  beforeEach(() => {
    useGraphStore.getState().clearGraph();
  });

  it('initializes with empty graph and null selection', () => {
    const s = useGraphStore.getState();
    expect(s.graphData.nodes).toEqual([]);
    expect(s.graphData.links).toEqual([]);
    expect(s.selectedNode).toBeNull();
    expect(Array.from(s.loadingNodes)).toEqual([]);
  });

  it('adds a single node (with default pagination values)', () => {
    const { addNode } = useGraphStore.getState();
    addNode(baseNode('addr_1', { loadedTransactions: undefined, currentOffset: undefined, hasMoreTransactions: undefined }));

    const state = useGraphStore.getState();
    expect(state.graphData.nodes.length).toBe(1);

    const n = state.graphData.nodes.find(n => n.id === 'addr_1')!;
    expect(n).toMatchObject({
      id: 'addr_1',
      loadedTransactions: 0,
      currentOffset: 0,
      hasMoreTransactions: true,
    });
  });

  it('adds multiple nodes and de-duplicates by id', () => {
    const { addNodes } = useGraphStore.getState();
    addNodes([baseNode('A'), baseNode('B')]);
    addNodes([baseNode('B'), baseNode('C')]); // B is duplicate, C is new
    const ids = useGraphStore.getState().graphData.nodes.map(n => n.id).sort();
    expect(ids).toEqual(['A', 'B', 'C']);
  });

  it('adds a single link', () => {
    const { addLink } = useGraphStore.getState();
    addLink(link('A', 'B', 'tx1'));
    expect(useGraphStore.getState().graphData.links).toEqual([
      { source: 'A', target: 'B', txHash: 'tx1', value: 1 },
    ]);
  });

  it('adds links and de-duplicates across calls (state-based dedupe)', () => {
    const { addLinks } = useGraphStore.getState();

    // First batch
    addLinks([
      link('A', 'B', 'tx1'),
      link('B', 'C', 'tx2'),
    ]);

    // Second batch includes a duplicate of tx1 and a new tx3
    addLinks([
      link('A', 'B', 'tx1'), // duplicate vs existing state
      link('A', 'B', 'tx3'), // new
    ]);

    const links = useGraphStore.getState().graphData.links;
    const sigs = links.map(l => `${l.source}-${l.target}-${l.txHash}`).sort();
    expect(sigs).toEqual(['A-B-tx1', 'A-B-tx3', 'B-C-tx2'].sort());
  });

  it('selects a node via setSelectedNode', () => {
    const { setSelectedNode } = useGraphStore.getState();
    setSelectedNode('addr_42');
    expect(useGraphStore.getState().selectedNode).toBe('addr_42');

    setSelectedNode(null);
    expect(useGraphStore.getState().selectedNode).toBeNull();
  });

  it('marks a node as expanded/collapsed via setNodeExpanded', () => {
    const { addNode, setNodeExpanded, getNode } = useGraphStore.getState();
    addNode(baseNode('addr_1'));
    setNodeExpanded('addr_1', true);
    expect(getNode('addr_1')!.isExpanded).toBe(true);
    setNodeExpanded('addr_1', false);
    expect(getNode('addr_1')!.isExpanded).toBe(false);
  });

  it('toggles loadingNodes via setNodeLoading and checks with isNodeLoading', () => {
    const { setNodeLoading, isNodeLoading } = useGraphStore.getState();
    expect(isNodeLoading('addr_L')).toBe(false);
    setNodeLoading('addr_L', true);
    expect(isNodeLoading('addr_L')).toBe(true);
    setNodeLoading('addr_L', false);
    expect(isNodeLoading('addr_L')).toBe(false);
  });

  it('clears graph (nodes, links, selection, loading set)', () => {
    const { addNode, addLink, setSelectedNode, setNodeLoading, clearGraph } = useGraphStore.getState();
    addNode(baseNode('n1'));
    addLink(link('n1', 'n2', 'tx'));
    setSelectedNode('n1');
    setNodeLoading('n1', true);

    clearGraph();

    const s = useGraphStore.getState();
    expect(s.graphData.nodes).toEqual([]);
    expect(s.graphData.links).toEqual([]);
    expect(s.selectedNode).toBeNull();
    expect(Array.from(s.loadingNodes)).toEqual([]);
  });

  it('updates node pagination via updateNodePagination', () => {
    const { addNode, updateNodePagination, getNode } = useGraphStore.getState();
    addNode(baseNode('addr_P', { loadedTransactions: 1, currentOffset: 10, hasMoreTransactions: true }));
    updateNodePagination('addr_P', { loadedTransactions: 6, currentOffset: 60, hasMoreTransactions: false });
    const n = getNode('addr_P')!;
    expect(n.loadedTransactions).toBe(6);
    expect(n.currentOffset).toBe(60);
    expect(n.hasMoreTransactions).toBe(false);
  });

  it('getNode returns the correct node (or undefined)', () => {
    const { addNode, getNode } = useGraphStore.getState();
    addNode(baseNode('X'));
    expect(getNode('X')!.id).toBe('X');
    expect(getNode('Y')).toBeUndefined();
  });
});
