import type { APIRoute } from 'astro';
import { searchWRLDSites } from '../../lib/typesense';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('q');
  
  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
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
  
  try {
    const results = await searchWRLDSites(query, filters);
    
    if (!results) {
      return new Response(JSON.stringify({ error: 'Search service unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Search API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
