# WRLD.one

> The unified directory for all WRLD platforms, services, and infrastructure.

![WRLD.one](https://wrld.one/og-image.png)

## Overview

WRLD.one serves as the central hub for discovering and navigating all WRLD Inc. services, platforms, and infrastructure. Built with modern web technologies and deployed on Cloudflare Workers for global edge performance.

## Features

- **Directory** - Browse all WRLD services organized by category
- **Search** - Instant search across all platforms and documentation
- **Status** - Real-time service status indicators
- **Responsive** - Fully responsive design for all devices
- **Fast** - Edge-deployed for sub-100ms response times globally

## WRLD Services

| Service | Domain | Description |
|---------|--------|-------------|
| WRLD Tech | wrld.tech | Primary technology portal and brand hub |
| WRLD Host | wrld.host | Enterprise-grade hosting and infrastructure |
| WRLD AI | wrld.ai | AI and machine learning platform |
| WRLD Domains | wrld.domains | Domain registration and management |
| WRLD Support | wrld.support | Customer support portal |
| WRLD Status | status.wrld.host | Service status and uptime monitoring |
| WRLD IPFS | ipfs.wrld.tech | Decentralized IPFS gateway |
| WRLD Docs | docs.wrld.tech | Technical documentation |
| WRLD Help | help.wrld.tech | Knowledge base and tutorials |
| WRLD Labs | labs.wrld.tech | Experimental projects and beta features |

## Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static site generation
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) - Edge deployment
- **Styling**: CSS Custom Properties with WRLD brand design system
- **Fonts**: Montserrat (display), Ubuntu (body), Source Sans 3 (sub)
- **Search**: Client-side instant search (Typesense integration planned)

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
wrld.one/
├── src/
│   ├── components/     # Astro components
│   ├── data/          # Site data and types
│   ├── layouts/       # Page layouts
│   ├── pages/         # Route pages
│   └── styles/        # Global CSS
├── public/            # Static assets
├── brand-guide/       # WRLD brand assets
├── astro.config.mjs   # Astro configuration
├── wrangler.toml      # Cloudflare Workers config
└── package.json
```

## Brand Guidelines

WRLD.one follows the official WRLD Inc. brand guidelines:

### Colors

- **Primary Blue**: `#00adee` (Vivid Cerulean)
- **Purple**: `#3d1f78` (Explorer of the Galaxies)
- **Gold**: `#d48c2f` (Opulent)
- **Dark Navy**: `#182534`
- **Light**: `#fcfcfc`

### Typography

- **Display**: Montserrat (700, 800)
- **Body**: Ubuntu (400, 500, 700)
- **Subheadings**: Source Sans 3 (400, 500, 600)

## Deployment

The site is automatically deployed to Cloudflare Workers on push to `main`:

```bash
# Manual deploy
npx wrangler deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Copyright © 2024 WRLD Inc. All rights reserved.

---

Built with ❤️ by [WRLD Inc.](https://wrld.tech)
