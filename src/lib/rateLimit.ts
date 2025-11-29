/**
 * Rate Limiting for Cloudflare Workers
 *
 * Uses KV namespace for distributed rate limiting across edge locations.
 * Falls back to in-memory limiting when KV is not available.
 *
 * Setup:
 * 1. Create KV namespace: wrangler kv:namespace create "RATE_LIMIT"
 * 2. Add to wrangler.toml:
 *    [[kv_namespaces]]
 *    binding = "RATE_LIMIT"
 *    id = "<your-namespace-id>"
 */

// Rate limit configuration
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Unique identifier for the rate limit (e.g., 'search-api') */
  identifier: string;
}

// Rate limit result
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the window */
  remaining: number;
  /** Timestamp when the window resets (Unix seconds) */
  resetAt: number;
  /** Total limit for the window */
  limit: number;
}

// KV namespace interface
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

// Environment with KV binding
export interface RateLimitEnv {
  RATE_LIMIT?: KVNamespace;
}

// In-memory fallback store (per-isolate, not distributed)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a given client
 *
 * @param env - Workers environment with optional RATE_LIMIT KV binding
 * @param clientId - Unique client identifier (IP, API key, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  env: RateLimitEnv,
  clientId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.identifier}:${clientId}`;
  const now = Math.floor(Date.now() / 1000);
  const windowEnd = now + config.windowSeconds;

  // Try KV first, fall back to memory
  if (env.RATE_LIMIT) {
    return checkRateLimitKV(env.RATE_LIMIT, key, now, windowEnd, config);
  }

  return checkRateLimitMemory(key, now, windowEnd, config);
}

/**
 * KV-based rate limiting (distributed)
 */
async function checkRateLimitKV(
  kv: KVNamespace,
  key: string,
  now: number,
  windowEnd: number,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const data = await kv.get(key);
    let count = 0;
    let resetAt = windowEnd;

    if (data) {
      const parsed = JSON.parse(data);
      // Check if window is still valid
      if (parsed.resetAt > now) {
        count = parsed.count;
        resetAt = parsed.resetAt;
      }
    }

    const allowed = count < config.limit;

    if (allowed) {
      // Increment counter
      await kv.put(
        key,
        JSON.stringify({ count: count + 1, resetAt }),
        { expirationTtl: config.windowSeconds }
      );
    }

    return {
      allowed,
      remaining: Math.max(0, config.limit - count - (allowed ? 1 : 0)),
      resetAt,
      limit: config.limit,
    };
  } catch (error) {
    console.error('Rate limit KV error:', error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: windowEnd,
      limit: config.limit,
    };
  }
}

/**
 * Memory-based rate limiting (per-isolate fallback)
 */
function checkRateLimitMemory(
  key: string,
  now: number,
  windowEnd: number,
  config: RateLimitConfig
): RateLimitResult {
  let entry = memoryStore.get(key);

  // Reset if window expired
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: windowEnd };
  }

  const allowed = entry.count < config.limit;

  if (allowed) {
    entry.count++;
    memoryStore.set(key, entry);
  }

  // Cleanup old entries periodically (simple garbage collection)
  if (Math.random() < 0.01) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt <= now) {
        memoryStore.delete(k);
      }
    }
  }

  return {
    allowed,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Get client identifier from request
 * Uses CF-Connecting-IP header (Cloudflare provides real client IP)
 */
export function getClientId(request: Request): string {
  // Cloudflare provides the real client IP
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;

  // Fallback headers
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

  const xRealIp = request.headers.get('X-Real-IP');
  if (xRealIp) return xRealIp;

  // Last resort - use a hash of various headers
  return 'unknown';
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.toString());
}

/**
 * Create rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Retry-After': (result.resetAt - Math.floor(Date.now() / 1000)).toString(),
  });
  addRateLimitHeaders(headers, result);

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000),
    }),
    {
      status: 429,
      headers,
    }
  );
}

// Default rate limit configs
export const RATE_LIMITS = {
  // Search API: 60 requests per minute per IP
  SEARCH_API: {
    limit: 60,
    windowSeconds: 60,
    identifier: 'search-api',
  } as RateLimitConfig,

  // General API: 100 requests per minute per IP
  GENERAL_API: {
    limit: 100,
    windowSeconds: 60,
    identifier: 'general-api',
  } as RateLimitConfig,
} as const;
