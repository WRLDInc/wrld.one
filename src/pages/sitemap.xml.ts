import type { APIRoute } from 'astro';

const site = 'https://wrld.one';

// Static pages with their priorities and change frequencies
const pages = [
  { url: '/', priority: 1.0, changefreq: 'daily' },
  { url: '/services', priority: 0.9, changefreq: 'weekly' },
  { url: '/search', priority: 0.8, changefreq: 'weekly' },
  { url: '/about', priority: 0.7, changefreq: 'monthly' },
];

export const GET: APIRoute = async () => {
  const lastmod = new Date().toISOString().split('T')[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages
  .map(
    (page) => `  <url>
    <loc>${site}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
