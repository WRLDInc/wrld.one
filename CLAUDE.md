# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WRLD.one is a unified directory portal for all WRLD Inc. services, platforms, and infrastructure. Built with Astro and deployed on Cloudflare Workers for global edge performance.

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build (requires Cloudflare Wrangler)
npm run preview

# Astro CLI
npm run astro
```

## Architecture

### Static Site Generation with Edge Deployment

- **Framework**: Astro 5.x with static output (`output: 'static'`)
- **Adapter**: `@astrojs/cloudflare` in directory mode for Cloudflare Workers deployment
- **Deployment**: Cloudflare Workers via Wrangler (configured in `wrangler.toml`)
- **Build**: Vite with esbuild minification and CSS optimization

### Data Architecture

All WRLD services are defined in `src/data/sites.ts` as a typed array of `WRLDSite` objects:

```typescript
interface WRLDSite {
  id: string;
  name: string;
  domain: string;
  url: string;
  description: string;
  category: 'core' | 'infrastructure' | 'services' | 'support' | 'labs' | 'partners';
  status: 'operational' | 'degraded' | 'maintenance' | 'offline';
  icon: string;
  color: string;
  features: string[];
  tags: string[];
  statusUrl?: string;
  parent?: string; // For sub-services (e.g., cPanel under wrld-cloud)
}
```

This data structure is the single source of truth for all services displayed on the site. When adding new services, update this file.

### Search Integration (Typesense)

The site includes Typesense integration for cross-site search:

- **Client**: Configured in `src/lib/typesense.ts`
- **Schema**: `wrld_sites` collection with fields for name, domain, description, category, status, tags, features, and scraped content
- **API Endpoint**: `/api/search` (see `src/pages/api/search.ts`)
- **Environment Variables**: See `.env.example` for Typesense configuration

**To set up search locally:**
```bash
# Run Typesense in Docker
docker run -d -p 8108:8108 -v/tmp/typesense-data:/data --name typesense \
  typesense/typesense:latest --data-dir /data --api-key=xyz --enable-cors

# Copy environment file
cp .env.example .env
```

Refer to `SEARCH_SETUP.md` for detailed search setup instructions, including collection initialization and content indexing strategies.

### Component Architecture

**Key Components** (`src/components/`):

- `Header.astro` - Site navigation with animated logo and search
- `Footer.astro` - Footer with social links and WRLD branding
- `SiteCard.astro` - Individual service cards with SVG border animations, status indicators, and hover effects
- `WorldMap.astro` - Animated world map background with data flow visualization

**Layouts** (`src/layouts/`):

- `BaseLayout.astro` - Base HTML structure with meta tags, fonts, and global styles

**Pages** (`src/pages/`):

- `index.astro` - Home page with hero, featured services, and categorized service grid
- `about.astro` - About WRLD Inc. page
- `services.astro` - Full services directory
- `search.astro` - Search interface with Typesense integration
- `api/search.ts` - API endpoint for Typesense search

### Styling System

Global styles are in `src/styles/global.css` using CSS custom properties:

**Design Tokens:**
- Dark theme backgrounds: `--bg-void`, `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- Accent colors: `--accent-primary` (blue), `--accent-secondary` (orange), `--accent-purple`
- Typography:
  - Display: `--font-display` (Montserrat)
  - Body: `--font-body` (Ubuntu, Source Sans 3)
  - Mono: `--font-mono` (Reddit Mono, JetBrains Mono)

**Component Styling Pattern:**
- Scoped `<style>` blocks in `.astro` components
- BEM-like naming convention (e.g., `site-card__header`, `site-card__icon`)
- CSS custom properties for theming
- Motion library for complex animations (border animations, data flow trails)

### Animation Patterns

The site uses the Motion library (`motion` npm package) for advanced animations:

- **Border Drawing Effects**: SVG path animations with `pathLength` and `stroke-dasharray`
- **Data Flow Trails**: Animated particles along paths using Motion's timeline
- **Line Traces**: Sequential drawing animations with timing offsets

Example pattern from `SiteCard.astro`:
```typescript
// SVG border with animated stroke-dasharray for drawing effect
<rect pathLength="1" stroke-dasharray="0 1" />
// Motion animates stroke-dasharray from [0, 1] to [1, 0]
```

### Brand Guidelines Integration

WRLD brand assets are in `brand-guide/`:

**Colors:**
- Primary Blue: `#3b82f6`
- Orange: `#f97316`
- Purple: `#8b5cf6`
- Dark Navy: `#0f172a` (background)

**Typography:**
- Display: Montserrat (700, 800)
- Body: Ubuntu (400, 500, 700)
- Subheadings: Source Sans 3 (400, 500, 600)

Maintain consistency with these brand guidelines when adding new components or pages.

## Deployment

**Cloudflare Workers Configuration** (`wrangler.toml`):

- Production: `wrld-one` worker, routed to `wrld.one/*`
- Staging: `wrld-one-staging` worker
- Assets directory: `./dist` (Astro build output)

**Manual Deployment:**
```bash
# Build and deploy
npm run build
npx wrangler deploy
```

**Environment Variables for Production:**
```bash
# Add Typesense API key secret
wrangler secret put TYPESENSE_API_KEY

# Public variables in wrangler.toml [vars]
PUBLIC_TYPESENSE_HOST=xxx.a1.typesense.net
PUBLIC_TYPESENSE_PORT=443
PUBLIC_TYPESENSE_PROTOCOL=https
```

## Key Patterns

### Adding a New Service

1. Add entry to `sites` array in `src/data/sites.ts`
2. Choose appropriate category, status, and provide icon/color
3. Service will automatically appear in the directory grid
4. Optionally index content in Typesense for search

### Modifying Animations

- Border animations use Motion library and SVG `pathLength` attribute
- Timeline-based animations are defined inline in component `<script>` blocks
- Adjust timing/easing in Motion's `animate()` calls

### Working with Categories

Categories are defined in `src/data/sites.ts`:
- `core` - Essential WRLD platforms
- `infrastructure` - Hosting and cloud services
- `services` - Business tools and utilities
- `support` - Help and assistance
- `labs` - Experimental projects
- `partners` - Cloud and technology partners

Use `getSitesByCategory(category)` helper to filter sites.

## Tech Stack Summary

- **Framework**: Astro 5.x (static generation)
- **Deployment**: Cloudflare Workers (edge)
- **Styling**: CSS Custom Properties + BEM-like conventions
- **Animation**: Motion library
- **Search**: Typesense (optional, see SEARCH_SETUP.md)
- **Fonts**: Montserrat, Ubuntu, Source Sans 3, Reddit Mono
- **Dev Tools**: Wrangler, Vite, esbuild
