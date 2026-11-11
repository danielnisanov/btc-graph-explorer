# 🪙 BTC Graph Explorer

Interactive blockchain investigation tool that visualizes **Bitcoin transactions** as a dynamic graph.
Built with **Next.js 16**, **React 19**, and **TypeScript**, it allows investigators to explore wallet connections, follow transaction flows, and inspect address details in real time using a **server-side proxy with caching**.

---

## 🚀 Features

*  **Dynamic Graph Visualization** – Explore Bitcoin transaction networks with force-directed layouts.
*  **Interactive Node Expansion** – Click any wallet to expand transactions & connected addresses.
*  **Smart Request Deduplication** – Guards against duplicate API calls using `isNodeLoading`.
*  **Server-Side Caching** – 5-minute in-memory caching (50–100× faster on cache hits).
*  **Rate Limiting** – Per-IP rate limiting (10 req/min) with UI countdown.
*  **API Log Panel** – Real-time panel showing requests, responses, errors, and timings.
*  **Address Sidebar** – Shows balance, total received, total sent, tx count, and connections.
*  **Graph Controls** – Zoom in/out, fit-to-screen, pan, center camera.
*  **Loading States & Error Handling** – UI feedback, retry suggestions, rate-limit warnings.
*  **Modular Architecture** – Clean structure with hooks, components, stores, and utilities.
*  **Full Test Suite** – Includes unit tests, component tests, and Playwright E2E testing.

---

## 🧠 Tech Stack

| Area             | Technology                               |
| ---------------- | ---------------------------------------- |
| Framework        | Next.js 16 (Turbopack)                   |
| Language         | TypeScript 5.9                           |
| React            | React 19.2 (Hooks)                       |
| Graph Library    | force-graph 1.51                         |
| State Management | Zustand 5.0                              |
| API Source       | BlockChain API                           |
| Styling          | Tailwind CSS                             |
| Package Manager  | pnpm                                     |
| Unit Tests       | Vitest + React Testing Library           |
| E2E Tests        | Playwright                               |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/blockchain/
│   │   └── route.ts             # Proxy with caching & rate limiting
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── graph/
│   │   ├── BlockchainGraph.tsx
│   │   ├── GraphControls.tsx
│   │   ├── GraphLegend.tsx
│   │   └── GraphLoadingState.tsx
│   ├── panels/
│   │   ├── AddressDetails.tsx
│   │   └── ApiLogWindow.tsx
│   ├── SearchBar.tsx
│   └── ui/
├── hooks/
│   ├── useBlockchainData.ts
│   ├── useGraphInstance.ts
│   ├── useGraphData.ts
│   └── useGraphVisuals.ts
├── store/
│   ├── graphStore.ts
│   └── apiLogStore.ts
├── services/
│   └── blockchain/
│       └── blockchainApi.ts
├── types/
│   ├── blockchain.ts
│   └── graph.ts
└── utils/
```

---

## 🎯 Key Architecture Decisions

### 🖥️ Server-Side Proxy (`/api/blockchain`)

The proxy handles:

1. **Caching** (5-minute TTL)
2. **Rate-limiting** (10 req/min per IP)
3. **Throttling** upstream calls (1.5 seconds between calls)
4. **Failover** to Blockchair / Blockchain.info
5. **Centralized error handling & logging**

**Benefits:**

* Eliminates CORS
* Reduces external API usage
* Prevents rate-limit lockouts
* Makes UI faster & more reliable

### 🧩 Request Deduplication

Nodes fetch data **once** thanks to:

```ts
if (missingBalance && !isFetchingBalance && !isNodeLoading(selectedNode.id)) {
  fetchBalance();
}
```

Prevents repeated fetches when UI re-renders.

### 🗂️ Zustand Stores

* **graphStore** → nodes, links, selection, loading, pagination
* **apiLogStore** → logs requests for the API Debug Panel

Lightweight, dependency-free, perfect for real-time updates.

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* pnpm 8+

### Install & Run

```bash
git clone https://github.com/danielnisanov/btc-graph-explorer.git
cd btc-graph-explorer
pnpm install
pnpm dev
```

Visit → **[http://localhost:3000](http://localhost:3000)**

### Build & Start

```bash
pnpm build
pnpm start
```

---

## 📖 Usage

### 1️⃣ Search

* Enter a Bitcoin address
* Or click **Try Sample** (Satoshi’s first address)

  <img width="1422" height="1185" alt="image" src="https://github.com/user-attachments/assets/1d8dcc7d-209f-4e59-9bab-0acbbfeff6ff" />


### 2️⃣ Explore Graph

* Click nodes to expand them
* Loading animation shows while fetching

  <img width="1407" height="1233" alt="image" src="https://github.com/user-attachments/assets/ffbb29fa-ad26-4b99-a95a-d07e5ef69979" />


### 3️⃣ Inspect Address Details

Sidebar includes:

* Balance
* Total received / sent
* Tx count
* Connected addresses

### 4️⃣ Graph Controls

* Fit
* Zoom In / Out
* Center
* Drag to pan

### 5️⃣ Debug Panel

Bottom-right:

* View all API requests
* See cache hits/misses
* Inspect timings and errors

---

## 🔧 Configuration

### Proxy Settings

`src/app/api/blockchain/route.ts`:

```ts
const CACHE_TTL = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const REQUEST_DELAY = 1500;
```

### Graph Physics

`src/hooks/useGraphInstance.ts`:

```ts
.cooldownTicks(100)
.nodeRelSize(8)
.linkDistance(100)
.chargeStrength(-300)
```

---

## 🧪 Testing

### ▶ Unit Tests

Run:

```bash
pnpm test
```

Covers:

* Blockchain API proxy
* SearchBar validation & behavior
* BlockchainGraph rendering & interactions
* Full graphStore logic (merging, pagination, loading state)

### ▶ End-to-End Tests (Playwright)

Run:

```bash
pnpm exec playwright test
```

E2E includes:

* Explore address → graph loads
* Rate limit handling (429)
* API failure (500)
* Invalid address validation
* Reload & back navigation stability
* No console errors
* Deterministic API stubbing:

```ts
page.route('**/api/blockchain**', route =>
  route.fulfill({ status: 200, body: JSON.stringify(stubGraphResponse) })
);
```

---

## 📊 Performance Metrics

| Event      | Time       |
| ---------- | ---------- |
| Cache Hit  | 5–10 ms    |
| Cache Miss | 500–600 ms |
| Speedup    | 50–100×    |

---

## 🎨 UI/UX

### Node Colors

| State      | Color        |
| ---------- | ------------ |
| Unexpanded | Gray         |
| Expanded   | Light Blue   |
| Selected   | Green        |
| Loading    | Blue (pulse) |

### Layout

* Header → SearchBar
* Left → AddressDetails
* Right → BlockchainGraph
* Bottom-right → API Log panel

---

## 🔒 Security

* Read-only blockchain data
* No private keys ever stored
* Proxy hides upstream API keys
* Strict validation & rate limiting
* Error boundaries throughout UI

---

## 📚 References

* [https://en.bitcoin.it/wiki/Address](https://en.bitcoin.it/wiki/Address)
* [https://github.com/vasturiano/force-graph](https://github.com/vasturiano/force-graph)
* [https://github.com/vasturiano/force-graph](https://github.com/vasturiano/force-graph)
* [https://nextjs.org/docs](https://nextjs.org/docs)
* [https://github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)
* [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

---
