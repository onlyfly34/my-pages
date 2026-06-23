// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';

// site / base 一律從 src/config/site.ts 推導，避免多處重複。
// 要切換部署模式或搬倉庫，只改 src/config/site.ts。
import { SITE_URL, BASE_PATH } from './src/config/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap(), preact()],
  markdown: {
    // 雙主題語法高亮：亮 / 暗各一套，靠 <html class="dark"> 切換（CSS 見 global.css）。
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      wrap: false,
    },
  },
});
