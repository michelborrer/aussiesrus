// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://aussiesrus.com.au',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/quotes/'),
    }),
  ],
});
