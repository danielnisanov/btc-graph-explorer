// app/api/blockchain/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ============================================
// REQUEST COUNTING & MONITORING
// ============================================

interface RequestStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  upstreamRequests: number;
  rateLimitHits: number;
  startTime: number;
}

const requestStats: RequestStats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  upstreamRequests: 0,
  rateLimitHits: 0,
  startTime: Date.now(),
};

// ============================================
// RATE LIMITING & CACHING CONFIGURATION
// ============================================

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory cache (use Redis in production)
const cache = new Map<string, CacheEntry>();
const rateLimitMap = new Map<string, RateLimitEntry>();

// Configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per IP
const REQUEST_DELAY = 1500; // 1.5 seconds between blockchain API calls

// Queue for throttling requests to blockchain.info
let lastRequestTime = 0;
const requestQueue: Array<() => void> = [];
let isProcessingQueue = false;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get client IP address for rate limiting
 */
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check if request is within rate limit
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limitEntry = rateLimitMap.get(ip);

  if (!limitEntry || now > limitEntry.resetTime) {
    // New window or expired window
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (limitEntry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((limitEntry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  limitEntry.count++;
  return { allowed: true };
}

/**
 * Get cached data if available and fresh
 */
function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Save data to cache
 */
function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Throttle requests to respect blockchain.info rate limits
 */
async function throttledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const executeRequest = async () => {
      try {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < REQUEST_DELAY) {
          await new Promise((r) => setTimeout(r, REQUEST_DELAY - timeSinceLastRequest));
        }

        lastRequestTime = Date.now();
        const result = await requestFn();
        resolve(result);

        // Process next in queue
        processQueue();
      } catch (error) {
        reject(error);
        processQueue();
      }
    };

    requestQueue.push(executeRequest);

    if (!isProcessingQueue) {
      processQueue();
    }
  });
}

function processQueue() {
  if (requestQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }

  isProcessingQueue = true;
  const nextRequest = requestQueue.shift();
  if (nextRequest) {
    nextRequest();
  }
}

/**
 * Fetch from blockchain.info with retry logic
 */
async function fetchFromBlockchain(url: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Bitcoin-Transaction-Explorer/1.0',
        },
      });

      if (response.status === 429) {
        // Rate limited by blockchain.info
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);

        if (attempt < retries - 1) {
          console.log(`Rate limited by blockchain.info. Retrying after ${retryAfter}s...`);
          await new Promise((r) => setTimeout(r, retryAfter * 1000));
          continue;
        }

        throw new Error(`Blockchain.info rate limit exceeded. Try again in ${retryAfter} seconds.`);
      }

      if (!response.ok) {
        throw new Error(`Blockchain API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries - 1) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function GET(request: NextRequest) {
  requestStats.totalRequests++;
  const requestNum = requestStats.totalRequests;

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔹 [REQUEST #${requestNum}] INCOMING
   Address: ${address}
   Limit: ${limit} | Offset: ${offset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Validation
    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    // Check rate limit
    const clientIp = getClientIp(request);
    const rateLimitCheck = checkRateLimit(clientIp);

    if (!rateLimitCheck.allowed) {
      requestStats.rateLimitHits++;
      console.log(`
⛔ [REQUEST #${requestNum}] CLIENT RATE LIMITED
   IP: ${clientIp}
   Retry After: ${rateLimitCheck.retryAfter}s
   Rate Limit Hits So Far: ${requestStats.rateLimitHits}
      `);
      return NextResponse.json(
        {
          error: 'Too many requests. Please slow down.',
          retryAfter: rateLimitCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
            'X-RateLimit-Reset': rateLimitMap.get(clientIp)?.resetTime.toString() || '',
          },
        }
      );
    }

    // Check cache
    const cacheKey = `${address}-${limit}-${offset}`;
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
      requestStats.cacheHits++;
      console.log(`
✅ [REQUEST #${requestStats.totalRequests}] CACHE HIT
   Address: ${address}
   Cache Hits: ${requestStats.cacheHits} | Misses: ${requestStats.cacheMisses}
   Hit Rate: ${Math.round((requestStats.cacheHits / requestStats.totalRequests) * 100)}%
      `);
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheTimestamp: cache.get(cacheKey)?.timestamp,
      });
    }

    requestStats.cacheMisses++;
    requestStats.upstreamRequests++;

    console.log(`
❌ [REQUEST #${requestStats.totalRequests}] CACHE MISS - FETCHING FROM BLOCKCHAIN.INFO
   Address: ${address}
   Upstream Requests So Far: ${requestStats.upstreamRequests}
   Cache Hits: ${requestStats.cacheHits} | Misses: ${requestStats.cacheMisses}
      `);

    // Fetch from blockchain.info with throttling
    const data = await throttledRequest(async () => {
      const url = `https://blockchain.info/rawaddr/${address}?limit=${limit}&offset=${offset}`;
      return await fetchFromBlockchain(url);
    });

    // Cache the result
    setCachedData(cacheKey, data);

    console.log(`
✅ [REQUEST #${requestNum}] SUCCESS - CACHED
   Address: ${address}
   Upstream Calls: ${requestStats.upstreamRequests}
   Total Requests Handled: ${requestStats.totalRequests}
      `);

    return NextResponse.json({
      ...data,
      cached: false,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`
❌ [REQUEST #${requestNum}] ERROR
   Error: ${errorMsg}
   Total Failed: ${requestStats.totalRequests}
    `);

    // Handle specific errors
    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          error: error.message,
          suggestion: 'The blockchain.info API is rate limiting requests. Try again in a few moments.',
        },
        { status: 429 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Failed to fetch address data',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Optional: Cleanup old cache entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }

      // Clean old rate limit entries
      for (const [ip, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
          rateLimitMap.delete(ip);
        }
      }
    },
    5 * 60 * 1000
  ); // Clean every 5 minutes
}
