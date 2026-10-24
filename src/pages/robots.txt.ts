import type { APIRoute } from 'astro';

// robots.txt: todo indexable salvo la versión "antes" (material de la charla). El sitemap solo existe si hay `site`.
export const GET: APIRoute = ({ site }) => {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /antes', 'Disallow: /en/antes'];
  if (site) lines.push('', `Sitemap: ${new URL('sitemap-index.xml', site).href}`);
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
