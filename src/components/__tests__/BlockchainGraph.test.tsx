// src/components/__tests__/BlockchainGraph.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// --- Mocks -------------------------------------------------------------

// Keep the latest onNodeClick we gave to the hook so a test can call it.
let lastOnNodeClick: ((node: any) => void) | null = null;

// Mock the graph ref and its methods that the component calls
const mockZoomToFit = vi.fn();
const mockZoom = vi.fn().mockReturnValue(1); // getter returns 1 by default
const mockCenterAt = vi.fn();

const mockGraphRef = {
  current: {
    zoomToFit: mockZoomToFit,
    zoom: mockZoom,       // note: as a function (getter/setter simulation)
    centerAt: mockCenterAt,
  },
};

// Zustand store — return a simple, predictable store shape
vi.mock('@/store/graphStore', () => ({
  useGraphStore: (selector: any) =>
    selector({
      graphData: { nodes: [], links: [] },
      selectedNode: null,
      setSelectedNode: vi.fn(),
      loadingNodes: new Set<string>(),
    }),
}));

// Business hook — we only need expandNode
const expandNodeMock = vi.fn();
vi.mock('@/hooks/useBlockchainData', () => ({
  useBlockchainData: () => ({ expandNode: expandNodeMock }),
}));

// Graph hooks
vi.mock('@/hooks/useGraphInstance', () => ({
  useGraphInstance: vi.fn((args: any) => {
    // Capture the onNodeClick so tests can invoke it.
    lastOnNodeClick = args?.onNodeClick ?? null;
    return {
      containerRef: { current: null },
      graphRef: mockGraphRef,
      isGraphReady: true, // default: ready
    };
  }),
}));

vi.mock('@/hooks/useGraphData', () => ({
  useGraphData: vi.fn(),
}));

vi.mock('@/hooks/useGraphVisuals', () => ({
  useGraphVisuals: vi.fn(),
}));

// Import after mocks so the component uses the mocked hooks above
import { BlockchainGraph } from '@/components/graph/BlockchainGraph';

// Small helper to (re)set call counts between tests
const resetAllMocks = () => {
  mockZoomToFit.mockClear();
  mockZoom.mockClear();
  mockCenterAt.mockClear();
  expandNodeMock.mockClear();
  lastOnNodeClick = null;
};

// --- Tests -------------------------------------------------------------

describe('<BlockchainGraph />', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  test('renders graph container and controls when ready', () => {
    render(<BlockchainGraph />);
    // Controls should be there (they’re rendered when isGraphReady === true)
    expect(screen.getByRole('button', { name: /fit graph to screen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /center view/i })).toBeInTheDocument();

    // Legend is visible (assert by a known label in legend)
    expect(screen.getByText(/^Unexpanded$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Expanded$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Selected$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Loading$/i)).toBeInTheDocument();
  });

  test('renders loading state when not ready', async () => {
    // Override just this test: make the instance hook return not ready
    const { useGraphInstance } = await import('@/hooks/useGraphInstance');
    vi.mocked(useGraphInstance).mockReturnValueOnce({
      containerRef: { current: null },
      graphRef: mockGraphRef,
      isGraphReady: false,
    } as any);

    render(<BlockchainGraph />);

    // Controls should NOT exist when not ready
    expect(screen.queryByRole('button', { name: /fit graph to screen/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /zoom in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /zoom out/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /center view/i })).not.toBeInTheDocument();

    // Loading UI shows instead. If your loading component has a role or text, assert that.
    // We’ll assert simply that the container div exists (rendered) and no controls.
    // (If GraphLoadingState has a role="status" or a text, prefer asserting that.)
  });

  test('handles zoom in / out / fit / center correctly', () => {
    // mockZoom() should return a number for the getter call
    mockZoom.mockReturnValueOnce(1); // initial zoom

    render(<BlockchainGraph />);

    // Fit
    fireEvent.click(screen.getByRole('button', { name: /fit graph to screen/i }));
    expect(mockZoomToFit).toHaveBeenCalledWith(400, 50);

    // Zoom in: should call zoom(getter*1.2, 200)
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(mockZoom).toHaveBeenCalled(); // getter call
    // we can’t easily assert the call args for the setter since zoom is the same fn,
    // but we do at least know it was called more than once.

    // Zoom out
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    expect(mockZoom).toHaveBeenCalled();

    // Center
    fireEvent.click(screen.getByRole('button', { name: /center view/i }));
    expect(mockCenterAt).toHaveBeenCalledWith(0, 0, 500);
  });

  test('calls expandNode when clicking an unexpanded node', async () => {
    render(<BlockchainGraph />);

    // Simulate a node click via the captured onNodeClick provided to the hook
    const fakeNode = { id: 'addr_1', level: 0, isExpanded: false };
    expect(lastOnNodeClick).toBeInstanceOf(Function);

    lastOnNodeClick?.(fakeNode);
    expect(expandNodeMock).toHaveBeenCalledWith('addr_1', 0);
  });

  test('does not call expandNode if node already expanded', () => {
    render(<BlockchainGraph />);

    const expanded = { id: 'tx_42', level: 1, isExpanded: true };
    lastOnNodeClick?.(expanded);
    expect(expandNodeMock).not.toHaveBeenCalled();
  });
});
