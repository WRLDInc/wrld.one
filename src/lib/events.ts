/**
 * WRLD.one Event Streaming via Cloudflare Pipelines
 *
 * Events are streamed to R2 as Iceberg tables for data lake analytics.
 * Use this for long-term storage, data warehouse queries, and batch processing.
 *
 * For real-time dashboards, use Analytics Engine (src/lib/analytics.ts)
 *
 * Query stored events with:
 * - DuckDB (local analysis)
 * - Spark / Trino (distributed processing)
 * - Cloudflare R2 + SQL API (coming soon)
 */

// =============================================================================
// Event Types
// =============================================================================

export type EventName =
  | 'page_view'
  | 'search'
  | 'service_click'
  | 'filter_change'
  | 'theme_toggle'
  | 'external_link'
  | 'error'
  | 'performance';

export interface BaseEvent {
  /** Event name for filtering/grouping */
  event_name: EventName;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Environment: production, staging, development */
  environment: string;
  /** Unique session ID (if available) */
  session_id?: string;
}

export interface PageViewEvent extends BaseEvent {
  event_name: 'page_view';
  /** Page path (e.g., /, /about, /services) */
  path: string;
  /** Referrer URL */
  referrer?: string;
  /** User agent string */
  user_agent?: string;
  /** Country code from CF headers */
  country?: string;
  /** City from CF headers */
  city?: string;
}

export interface SearchEvent extends BaseEvent {
  event_name: 'search';
  /** Search query */
  query: string;
  /** Number of results returned */
  results_count: number;
  /** Active filters */
  filters?: {
    category?: string[];
    status?: string[];
    tags?: string[];
  };
  /** Search latency in ms */
  latency_ms?: number;
  /** Whether result was from cache */
  cache_hit?: boolean;
}

export interface ServiceClickEvent extends BaseEvent {
  event_name: 'service_click';
  /** Service ID clicked */
  service_id: string;
  /** Service name */
  service_name: string;
  /** Service category */
  category: string;
  /** Source page */
  source_page: string;
}

export interface FilterChangeEvent extends BaseEvent {
  event_name: 'filter_change';
  /** Filter type changed */
  filter_type: 'category' | 'status' | 'tags';
  /** New filter value(s) */
  filter_value: string[];
  /** Page where filter was changed */
  page: string;
}

export interface ThemeToggleEvent extends BaseEvent {
  event_name: 'theme_toggle';
  /** New theme */
  theme: 'light' | 'dark';
  /** Previous theme */
  previous_theme: 'light' | 'dark';
}

export interface ExternalLinkEvent extends BaseEvent {
  event_name: 'external_link';
  /** Destination URL */
  url: string;
  /** Link text/label */
  label?: string;
  /** Source page */
  source_page: string;
}

export interface ErrorEvent extends BaseEvent {
  event_name: 'error';
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** Error type/name */
  error_type?: string;
  /** Page where error occurred */
  page?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

export interface PerformanceEvent extends BaseEvent {
  event_name: 'performance';
  /** Metric name (e.g., LCP, FID, CLS, TTFB) */
  metric: string;
  /** Metric value */
  value: number;
  /** Page path */
  page: string;
  /** Rating: good, needs-improvement, poor */
  rating?: 'good' | 'needs-improvement' | 'poor';
}

export type WRLDEvent =
  | PageViewEvent
  | SearchEvent
  | ServiceClickEvent
  | FilterChangeEvent
  | ThemeToggleEvent
  | ExternalLinkEvent
  | ErrorEvent
  | PerformanceEvent;

// =============================================================================
// Pipeline Binding Interface
// =============================================================================

interface PipelineBinding {
  send(events: unknown[]): Promise<void>;
}

export interface EventsEnv {
  EVENTS?: PipelineBinding;
  ENVIRONMENT?: string;
}

// =============================================================================
// Event Helpers
// =============================================================================

/**
 * Send events to the Pipeline
 */
export async function sendEvents(
  env: EventsEnv,
  events: WRLDEvent[]
): Promise<boolean> {
  if (!env.EVENTS) {
    console.warn('EVENTS pipeline binding not available');
    return false;
  }

  try {
    await env.EVENTS.send(events);
    return true;
  } catch (error) {
    console.error('Failed to send events to pipeline:', error);
    return false;
  }
}

/**
 * Send a single event
 */
export async function sendEvent(
  env: EventsEnv,
  event: Omit<WRLDEvent, 'timestamp' | 'environment'>
): Promise<boolean> {
  const fullEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'development',
  } as WRLDEvent;

  return sendEvents(env, [fullEvent]);
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Track a page view
 */
export function trackPageView(
  env: EventsEnv,
  request: Request,
  path: string
): Promise<boolean> {
  const cfData = (request as { cf?: { country?: string; city?: string } }).cf;

  return sendEvent(env, {
    event_name: 'page_view',
    path,
    referrer: request.headers.get('Referer') || undefined,
    user_agent: request.headers.get('User-Agent') || undefined,
    country: cfData?.country,
    city: cfData?.city,
  });
}

/**
 * Track a search
 */
export function trackSearch(
  env: EventsEnv,
  query: string,
  resultsCount: number,
  options?: {
    filters?: SearchEvent['filters'];
    latencyMs?: number;
    cacheHit?: boolean;
  }
): Promise<boolean> {
  return sendEvent(env, {
    event_name: 'search',
    query,
    results_count: resultsCount,
    filters: options?.filters,
    latency_ms: options?.latencyMs,
    cache_hit: options?.cacheHit,
  });
}

/**
 * Track a service click
 */
export function trackServiceClick(
  env: EventsEnv,
  serviceId: string,
  serviceName: string,
  category: string,
  sourcePage: string
): Promise<boolean> {
  return sendEvent(env, {
    event_name: 'service_click',
    service_id: serviceId,
    service_name: serviceName,
    category,
    source_page: sourcePage,
  });
}

/**
 * Track an error
 */
export function trackError(
  env: EventsEnv,
  error: Error,
  context?: Record<string, unknown>
): Promise<boolean> {
  return sendEvent(env, {
    event_name: 'error',
    message: error.message,
    stack: error.stack,
    error_type: error.name,
    context,
  });
}

/**
 * Track a performance metric (Core Web Vitals)
 */
export function trackPerformance(
  env: EventsEnv,
  metric: string,
  value: number,
  page: string,
  rating?: 'good' | 'needs-improvement' | 'poor'
): Promise<boolean> {
  return sendEvent(env, {
    event_name: 'performance',
    metric,
    value,
    page,
    rating,
  });
}

// =============================================================================
// Batch Helper for High-Volume Events
// =============================================================================

/**
 * Create an event batcher for high-volume scenarios
 * Collects events and sends them in batches
 */
export function createEventBatcher(env: EventsEnv, maxBatchSize = 100) {
  const batch: WRLDEvent[] = [];

  return {
    add(event: Omit<WRLDEvent, 'timestamp' | 'environment'>) {
      batch.push({
        ...event,
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'development',
      } as WRLDEvent);

      if (batch.length >= maxBatchSize) {
        return this.flush();
      }
      return Promise.resolve(true);
    },

    async flush(): Promise<boolean> {
      if (batch.length === 0) return true;

      const toSend = [...batch];
      batch.length = 0;

      return sendEvents(env, toSend);
    },

    get size() {
      return batch.length;
    },
  };
}
