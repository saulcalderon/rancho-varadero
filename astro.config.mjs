// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// URL pública del sitio. De aquí salen canonical, hreflang, og:url, og:image absoluta, JSON-LD, sitemap y robots.txt.
// El dominio de producción es https://ranchovaradero.alquileresmm.com
const site = process.env.SITE_URL || 'https://ranchovaradero.alquileresmm.com';

// https://astro.build/config
export default defineConfig({
  site,
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: site
    ? [
        sitemap({
          // La versión "antes" y el panel de opciones son material de la charla: no se indexan.
          filter: (page) => !/\/(antes|opciones)\/?$/.test(new URL(page).pathname),
          i18n: { defaultLocale: 'es', locales: { es: 'es-SV', en: 'en' } },
        }),
      ]
    : [],
  // Manrope, servida desde el propio dominio (subset latin, variable 200–800). Licencia OFL junto al archivo.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Manrope',
      cssVariable: '--font-manrope',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/manrope-latin-wght-normal.woff2'],
            weight: '200 800',
            style: 'normal',
          },
        ],
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
