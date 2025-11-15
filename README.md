# 🪙 BTC Graph Explorer

Interactive blockchain investigation tool that visualizes **Bitcoin transactions** as a dynamic graph.
Built with **Next.js 16**, **React 19**, and **TypeScript**, it helps investigators explore wallet connections, follow transaction flows, and inspect address details in real time using a **server-side proxy with caching**.

---

## 🚀 Features

- 🔗 **Dynamic Graph Visualization** – Explore Bitcoin transaction networks visually with force-directed simulation.
- 🧭 **Interactive Node Expansion** – Click a wallet to expand its connected transactions.
- ⚡ **Smart Request Deduplication** – Prevents duplicate API calls when expanding nodes using `isNodeLoading` guard.
- 💾 **Server-Side Caching** – 5-minute TTL in-memory cache reduces API load and improves response times (50-100x faster on cache hits).
- 🛡️ **Rate Limiting** – Per-IP rate limiting (10 requests/minute) with user-friendly countdown timer.
- 📊 **API Log Panel** – Real-time debugging with expandable log window showing requests, responses, and performance metrics.
- 🪙 **Address Details Sidebar** – Full address information including balance, transaction statistics, and connected addresses.
- 🎮 **Graph Controls** – Zoom in/out, fit-to-screen, pan, and center controls for easy navigation.
- 🌀 **Loading States & Error Handling** – Clear UI feedback, rate limit warnings, and graceful error messages.
- 🧩 **Modular Architecture** – Built with custom hooks and component separation for maintainability and scalability.

---

## 🧠 Tech Stack

| Area | Technology |
|------|-------------|
| Framework | [Next.js 16](https://nextjs.org/) with Turbopack |
| Language | [TypeScript 5.9](https://www.typescriptlang.org/) |
| React | [React 19.2](https://react.dev/) with Hooks |
| Graph Library | [force-graph 1.51](https://github.com/vasturiano/force-graph) |
| State Management | [Zustand 5.0](https://github.com/pmndrs/zustand) |
| Data Source | [Mempool.space API](https://mempool.space/api) (with fallback to Blockchair) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Package Manager | [pnpm](https://pnpm.io/) |

---

## 📋 Project Structure

```
src/
├── app/
│   ├── api/blockchain/
│   │   └── route.ts             # Server-side proxy with caching & rate limiting
│   ├── globals.css              # Global Tailwind styles
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Main page with grid layout
├── components/
│   ├── graph/
│   │   ├── BlockchainGraph.tsx  # Main force-graph visualization
│   │   ├── GraphControls.tsx    # Zoom/fit/center control buttons
│   │   ├── GraphLegend.tsx      # Node state legend
│   │   └── GraphLoadingState.tsx # Loading skeleton
│   ├── panels/
│   │   ├── AddressDetails.tsx   # Address info sidebar with balance
│   │   └── ApiLogWindow.tsx     # API debugging panel
│   ├── SearchBar.tsx            # Bitcoin address search input with rate limit UI
│   └── ui/                      # Reusable UI components
├── hooks/
│   ├── useBlockchainData.ts     # Data fetching & graph expansion logic
│   ├── useGraphInstance.ts      # Force-graph initialization and setup
│   ├── useGraphData.ts          # Graph data update logic
│   └── useGraphVisuals.ts       # Node color/size update logic
├── store/
│   ├── graphStore.ts            # Zustand store: graph state, node selection
│   └── apiLogStore.ts           # Zustand store: API logging
├── services/
│   └── blockchain/
│       └── blockchainApi.ts     # Blockchain API client with error handling
├── types/
│   ├── blockchain.ts            # Bitcoin transaction & address types
│   └── graph.ts                 # Graph node, link, and data types
└── utils/
```

---

## 🎯 Key Architecture Decisions

### Server-Side Proxy (`/api/blockchain`)

All blockchain API calls go through a Next.js server-side proxy that:

1. **Caches Responses** – 5-minute TTL in-memory cache with automatic cleanup
2. **Rate Limits Clients** – Per-IP rate limiting to prevent abuse
3. **Throttles Upstream Calls** – 1.5-second delays between blockchain API requests
4. **Supports Fallbacks** – Primary: Mempool.space, Secondary: Blockchair, Tertiary: Blockchain.info
5. **Tracks Statistics** – Monitors cache hits/misses, upstream calls, and rate limit events

**Benefits:**
- Eliminates CORS issues (all requests to same origin)
- Reduces API load through intelligent caching
- Protects against rate limits through request throttling
- Centralized error handling and logging

### Request Deduplication

The `AddressDetails` component includes a guard that checks `isNodeLoading()` before fetching balance data. This prevents duplicate requests when a node is already being loaded by the `expandNode` action:

```typescript
if (missingBalance && !isFetchingBalance && !isNodeLoading(selectedNode.id)) {
  // Fetch balance - only if not already loading from expansion
}
```

**Result:** Each node expansion = 1 API call (not 5+)

### State Management with Zustand

Two main stores maintain application state:

1. **graphStore** – Manages graph data, selected nodes, and loading state
2. **apiLogStore** – Tracks API calls for debugging

Both are lightweight and performant, enabling real-time updates without prop drilling.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (or 20+)
- **pnpm** 8+ (recommended) or npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/danielnisanov/btc-graph-explorer.git
cd btc-graph-explorer

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open browser - http://localhost:3000
```

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 📖 Usage

1. **Search for an Address**
   - Enter a Bitcoin address in the search bar (e.g., `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`)
   - Or click "Try sample" to load Satoshi's first address
   - Address data loads and displays as a graph

2. **Expand Nodes**
   - Click any node (wallet address) in the graph
   - The node expands to show its connected transactions
   - Loading indicator shows while fetching data
   - Connected addresses appear as new nodes

3. **View Address Details**
   - Selected node information appears in the right sidebar
   - Shows balance, transaction counts, and connected addresses
   - Click connected addresses to navigate

4. **Use Graph Controls**
   - **Fit** – Zoom to fit all nodes on screen
   - **Zoom In/Out** – Manual zoom control
   - **Center** – Return to origin (0, 0)
   - **Pan** – Hold middle mouse button and drag

5. **Debug API Calls**
   - Check the API Log panel at bottom-right
   - Expand logs to view request/response details
   - Monitor cache hits vs. upstream calls
   - View request duration and status codes

---

## 🔧 Configuration

### Server-Side Proxy Settings

Edit `src/app/api/blockchain/route.ts` to adjust:

```typescript
const CACHE_TTL = 5 * 60 * 1000;              // Cache duration (5 minutes)
const RATE_LIMIT_WINDOW = 60 * 1000;          // Rate limit window (1 minute)
const MAX_REQUESTS_PER_WINDOW = 10;           // Max requests per IP per window
const REQUEST_DELAY = 1500;                   // Delay between upstream calls (1.5s)
```

### Graph Settings

Edit `src/hooks/useGraphInstance.ts` to customize:

```typescript
.cooldownTicks(100)                           // Simulation iterations
.nodeRelSize(8)                               // Node size
.linkDistance(100)                            // Link length
.chargeStrength(-300)                         // Node repulsion
```

---

## 📊 Performance Metrics

### Cache Performance

- **Cache Hit**: 5-10ms response time
- **Cache Miss (Upstream)**: 500-600ms response time
- **Speed Improvement**: 50-100x faster on cache hits

### Request Patterns

- **Fresh Address**: 1 API call to upstream + 1 cache store
- **Re-expansion (within 5 min)**: 100% cache hit, 0 upstream calls
- **Multi-tab Access**: Shares cache across browser tabs

---

## 🐛 Debugging

### Console Logging

All major components log to console:

- `🔹 [REQUEST #N]` – Proxy request lifecycle
- `✅ CACHE HIT` – Data served from cache
- `❌ CACHE MISS` – Upstream API call made
- `⛔ CLIENT RATE LIMITED` – Too many requests from IP
- `📊 Fetching balance...` – AddressDetails data load

### API Log Window

The bottom-right API log panel shows:

- Request method, URL, and timestamp
- Response status code and duration
- Error messages and helpful suggestions
- Success/error counts and average response time

---

## 🎨 UI/UX Features

### Layout

- **Header**: SearchBar with address input and rate limit countdown
- **Main Content Grid (2 columns)**:
  - Left sidebar (360px): AddressDetails panel
  - Right section: BlockchainGraph visualization
- **Bottom Right**: ApiLogWindow (expandable/collapsible)

### Visual Indicators

| State | Color | Meaning |
|-------|-------|---------|
| Unexpanded | Gray | Node not yet explored |
| Expanded | Light Blue | Node has connected transactions |
| Selected | Green | Currently selected node |
| Loading | Blue (pulsing) | Fetching data in progress |

---

## 🔒 Security & Best Practices

1. **No Private Keys Stored** – Read-only blockchain data only
2. **Rate Limiting** – Prevents API abuse and excessive requests
3. **Server-Side Proxy** – Hides API endpoints from client
4. **CORS Protected** – All requests go through same origin
5. **Error Boundaries** – Graceful error handling throughout
6. **Input Validation** – Bitcoin addresses validated before use

---

## 📚 Resources & References

- [Bitcoin Address Formats](https://en.bitcoin.it/wiki/Address)
- [Mempool.space API Docs](https://mempool.space/docs/api)
- [Force-graph Documentation](https://github.com/vasturiano/force-graph)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
