import type { APIRoute } from 'astro';
import { searchWRLDSites } from '../../lib/typesense';
import {
  checkRateLimit,
  getClientId,
  addRateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
  type RateLimitEnv,
} from '../../lib/rateLimit';
import { trackSearch, type EventsEnv } from '../../lib/events';

// This endpoint must be server-rendered to access request headers for rate limiting
export const prerender = false;

// Cache TTL in seconds (5 minutes for search results)
const CACHE_TTL = 300;

// Standard response headers
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Create cached response with appropriate headers
function createCachedResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...jsonHeaders,
      'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}`,
      'CDN-Cache-Control': `max-age=${CACHE_TTL}`,
      'Cloudflare-CDN-Cache-Control': `max-age=${CACHE_TTL}`,
    }
  });
}

// Create error response (not cached)
function createErrorResponse(error: string, status: number): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      ...jsonHeaders,
      'Cache-Control': 'no-store',
    }
  });
}

export const GET: APIRoute = async ({ url, request, locals }) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  // Get environment from Astro locals (set by Cloudflare adapter)
  const env = (locals as { runtime?: { env?: RateLimitEnv & EventsEnv } }).runtime?.env || {};
  const clientId = getClientId(request);
  const rateLimitResult = await checkRateLimit(env, clientId, RATE_LIMITS.SEARCH_API);
  const startTime = Date.now();

  if (!rateLimitResult.allowed) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const query = url.searchParams.get('q');

  if (!query) {
    return createErrorResponse('Query parameter required', 400);
  }

  // Validate query length to prevent abuse
  if (query.length > 200) {
    return createErrorResponse('Query too long', 400);
  }

  // Parse filters from query params
  const categoryFilter = url.searchParams.get('category')?.split(',').filter(Boolean);
  const statusFilter = url.searchParams.get('status')?.split(',').filter(Boolean);
  const tagsFilter = url.searchParams.get('tags')?.split(',').filter(Boolean);

  const filters = {
    category: categoryFilter,
    status: statusFilter,
    tags: tagsFilter
  };

  // Create cache key from normalized request
  const cacheKey = new URL(request.url);
  cacheKey.searchParams.sort(); // Normalize query params for consistent cache keys
  const cacheRequest = new Request(cacheKey.toString());

  // Try to get from Cloudflare edge cache first
  const cache = caches.default;
  let cachedResponse = await cache.match(cacheRequest);

  if (cachedResponse) {
    // Track cache hit (non-blocking)
    trackSearch(env, query, -1, {
      filters,
      latencyMs: Date.now() - startTime,
      cacheHit: true,
    }).catch(() => {}); // Ignore tracking errors

    // Return cached response with indicator headers
    const headers = new Headers(cachedResponse.headers);
    headers.set('X-Cache', 'HIT');
    addRateLimitHeaders(headers, rateLimitResult);
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      headers
    });
  }

  try {
    const results = await searchWRLDSites(query, filters);

    if (!results) {
      return createErrorResponse('Search service unavailable', 503);
    }

    // Track search (non-blocking)
    const resultsCount = (results as { found?: number }).found ?? 0;
    trackSearch(env, query, resultsCount, {
      filters,
      latencyMs: Date.now() - startTime,
      cacheHit: false,
    }).catch(() => {}); // Ignore tracking errors

    // Create response and cache it
    const response = createCachedResponse(results);

    // Clone response before caching (response body can only be read once)
    const responseToCache = response.clone();

    // Cache the response at the edge (non-blocking)
    cache.put(cacheRequest, responseToCache);

    // Add cache miss and rate limit headers
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'MISS');
    addRateLimitHeaders(headers, rateLimitResult);

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Search API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
