import type { APIRoute } from 'astro';
import { trackEvent, type AnalyticsEnv } from '../../lib/analytics';

// This endpoint tests Analytics Engine by writing a test event
export const prerender = false;

interface Env extends AnalyticsEnv {
  ENVIRONMENT?: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = (locals as { runtime?: { env?: Env } }).runtime?.env;
  const hasAnalytics = !!env?.ANALYTICS_ENGINE;

  // Write a test event
  if (env) {
    trackEvent(env, {
      type: 'page_view',
      path: '/api/analytics-test',
      referrer: request.headers.get('Referer') || undefined,
      userAgent: request.headers.get('User-Agent') || undefined,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    analyticsEngineAvailable: hasAnalytics,
    timestamp: new Date().toISOString(),
    message: hasAnalytics
      ? 'Analytics Engine binding available - test event written'
      : 'Analytics Engine binding not available in this environment',
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
};
