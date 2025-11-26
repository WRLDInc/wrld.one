# WRLD.one Search Setup

This document explains how to set up cross-site search using Typesense.

## Architecture

WRLD.one uses **Typesense** for fast, typo-tolerant search across all WRLD sites. The search indexes:
- Site metadata (name, description, category, status)
- Site features and tags
- Scraped content from each site (coming from crawlers)

## Setup Options

### Option 1: Docker (Recommended for local dev)

```bash
# Run Typesense in Docker
docker run -d \
  -p 8108:8108 \
  -v/tmp/typesense-data:/data \
  --name typesense \
  typesense/typesense:latest \
  --data-dir /data \
  --api-key=xyz \
  --enable-cors
```

### Option 2: Typesense Cloud (Recommended for production)

1. Sign up at https://cloud.typesense.org
2. Create a cluster
3. Get your API key and host URL
4. Update `.env` with production credentials

### Option 3: Self-hosted Typesense

Download from https://typesense.org/downloads/ and run:

```bash
./typesense-server --data-dir=/tmp/typesense-data --api-key=xyz --enable-cors
```

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update values if needed (defaults work with Docker setup above)

## Initialize Collection

Run this script to create the Typesense collection:

```bash
npm run search:init
```

Or manually in Node:

```typescript
import { initializeTypesenseCollection } from './src/lib/typesense';
await initializeTypesenseCollection();
```

## Index Sites

To index WRLD sites, you can:

### Manual indexing (for initial setup):

```typescript
import { indexSiteContent } from './src/lib/typesense';
import { sites } from './src/data/sites';

for (const site of sites) {
  await indexSiteContent({
    ...site,
    content: '' // Add scraped content here
  });
}
```

### Automated crawling (recommended):

Set up a scheduled job (GitHub Actions, cron, Cloudflare Workers Cron) to:
1. Crawl each WRLD site
2. Extract text content
3. Index via `indexSiteContent()` API

Example crawl script structure:

```typescript
import * as cheerio from 'cheerio';

async function crawlSite(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  // Extract main content
  const content = $('main, article, .content').text()
    .replace(/\s+/g, ' ')
    .trim();
  
  return content;
}
```

## Search API

### Endpoint: `/api/search`

**Parameters:**
- `q` (required): Search query
- `category` (optional): Filter by category (comma-separated)
- `status` (optional): Filter by status (comma-separated)
- `tags` (optional): Filter by tags (comma-separated)

**Example:**
```bash
curl "http://localhost:4321/api/search?q=cloud&category=infrastructure,core"
```

**Response:**
```json
{
  "found": 2,
  "hits": [
    {
      "document": {
        "id": "wrld-cloud",
        "name": "WRLD Cloud",
        "description": "...",
        "url": "https://cloud.wrld.host"
      },
      "highlight": { ... }
    }
  ]
}
```

## Frontend Integration

The search page (`/search`) uses the API endpoint with instant results as you type.

### Key features:
- Debounced search (300ms)
- Category and status filters
- Highlight matching terms
- Keyboard navigation (coming soon)

## Production Deployment

### Cloudflare Workers:

1. Add secrets to Wrangler:
   ```bash
   wrangler secret put TYPESENSE_API_KEY
   ```

2. Set environment variables in `wrangler.toml`:
   ```toml
   [vars]
   PUBLIC_TYPESENSE_HOST = "xxx.a1.typesense.net"
   PUBLIC_TYPESENSE_PORT = "443"
   PUBLIC_TYPESENSE_PROTOCOL = "https"
   ```

### Content Indexing Strategy:

**Recommended approach:**
1. Set up a GitHub Action or Cloudflare Worker cron job
2. Crawl each WRLD site weekly (or on-demand)
3. Update Typesense index with fresh content
4. Keep search results up-to-date automatically

**Alternative (simpler but less dynamic):**
- Manually maintain content snippets in `src/data/sites.ts`
- Run indexing script after updates
- Good for MVP, less maintenance overhead

## Future Enhancements

- [ ] Add semantic search with embeddings
- [ ] Implement result caching
- [ ] Add search analytics
- [ ] Faceted search UI
- [ ] Search suggestions/autocomplete
- [ ] Multi-language support
- [ ] Document search (PDFs, docs)

## MCP Server (Optional)

For AI-powered search assistance, consider setting up an MCP server that:
- Provides context about WRLD sites
- Answers questions using indexed content
- Suggests relevant sites based on user needs

This could integrate with the existing knowledge graph or use Typesense data directly.

## Questions?

Contact the WRLD team or check Typesense docs: https://typesense.org/docs/
