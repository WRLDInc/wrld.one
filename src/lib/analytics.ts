/**
 * Cloudflare Analytics Engine Helper
 *
 * PURPOSE: Real-time analytics and dashboards via Analytics Engine
 * - Fast queries via GraphQL API (Cloudflare Dashboard > Analytics Engine)
 * - Built-in Cloudflare Dashboard widgets
 * - Best for: Live dashboards, quick aggregations, recent data
 *
 * This complements the Pipeline events (src/lib/events.ts):
 * - Pipeline: Long-term storage in R2 as Iceberg/Parquet (data lake)
 * - Analytics Engine: Real-time queries and dashboard visualization
 *
 * You can use BOTH for the same events - send to Pipeline for storage,
 * and Analytics Engine for real-time querying.
 *
 * Usage with Analytics Engine binding enabled in wrangler.toml:
 *
 * [[analytics_engine_datasets]]
 * binding = "ANALYTICS"
 * dataset = "wrldone_events"
 *
 * Data can be queried via Cloudflare Dashboard or GraphQL API
 */

// Analytics event types
export type AnalyticsEventType =
  | 'page_view'
  | 'search_query'
  | 'service_click'
  | 'filter_used'
  | 'theme_toggle'
  | 'external_link';

// Analytics event data structure
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  path?: string;
  query?: string;
  category?: string;
  serviceId?: string;
  theme?: 'light' | 'dark';
  referrer?: string;
  userAgent?: string;
}

// Analytics Engine binding interface
interface AnalyticsEngineDataset {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

// Environment with Analytics binding
interface AnalyticsEnv {
  ANALYTICS?: AnalyticsEngineDataset;
}

/**
 * Write an analytics event to Cloudflare Analytics Engine
 *
 * @param env - The Workers environment containing the ANALYTICS binding
 * @param event - The analytics event to track
 *
 * Data Point Structure:
 * - indexes[0]: event type (for filtering)
 * - blobs[0]: path
 * - blobs[1]: query/serviceId
 * - blobs[2]: category
 * - blobs[3]: referrer
 * - blobs[4]: user agent
 * - doubles[0]: timestamp
 */
export function trackEvent(env: AnalyticsEnv, event: AnalyticsEvent): void {
  if (!env.ANALYTICS) {
    // Analytics not configured, silently skip
    return;
  }

  try {
    env.ANALYTICS.writeDataPoint({
      indexes: [event.type],
      blobs: [
        event.path || '',
        event.query || event.serviceId || '',
        event.category || event.theme || '',
        event.referrer || '',
        event.userAgent || '',
      ],
      doubles: [Date.now()],
    });
  } catch (error) {
    // Don't let analytics errors affect the main request
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track a page view
 */
export function trackPageView(
  env: AnalyticsEnv,
  path: string,
  referrer?: string,
  userAgent?: string
): void {
  trackEvent(env, {
    type: 'page_view',
    path,
    referrer,
    userAgent,
  });
}

/**
 * Track a search query
 */
export function trackSearchQuery(
  env: AnalyticsEnv,
  query: string,
  category?: string
): void {
  trackEvent(env, {
    type: 'search_query',
    query,
    category,
  });
}

/**
 * Track a service card click
 */
export function trackServiceClick(
  env: AnalyticsEnv,
  serviceId: string,
  category: string
): void {
  trackEvent(env, {
    type: 'service_click',
    serviceId,
    category,
  });
}

/**
 * Track filter usage
 */
export function trackFilterUsed(
  env: AnalyticsEnv,
  category: string
): void {
  trackEvent(env, {
    type: 'filter_used',
    category,
  });
}

/**
 * Example GraphQL query to retrieve analytics data:
 *
 * query {
 *   viewer {
 *     accounts(filter: { accountTag: "YOUR_ACCOUNT_TAG" }) {
 *       wrldoneAnalyticsAdaptiveGroups(
 *         filter: {
 *           datetime_geq: "2024-01-01T00:00:00Z"
 *           datetime_leq: "2024-12-31T23:59:59Z"
 *         }
 *         limit: 1000
 *         orderBy: [count_DESC]
 *       ) {
 *         count
 *         dimensions {
 *           index1  # event type
 *           blob1   # path
 *           blob2   # query/serviceId
 *         }
 *       }
 *     }
 *   }
 * }
 */
