import { defineConfig, type Plugin } from 'vite';
import { statsMarkup, tariffsMarkup } from './src/data/markup.ts';
import {
  ctaInnerHTML,
  demoHTML,
  faqHTML,
  painsHTML,
  processHTML,
  rolesHTML,
} from './src/content/markup.ts';

/** GitHub Pages project site: https://akzhol-lab.github.io/ai-solutions-immersive/ */
const PAGES_BASE = '/ai-solutions-immersive/';

/** Injects markup rendered from data and copy (src/data, src/content) into index.html. */
function dataMarkup(): Plugin {
  return {
    name: 'data-markup',
    transformIndexHtml(html) {
      return html
        .replace('<!-- @pains -->', painsHTML())
        .replace('<!-- @demo -->', demoHTML())
        .replace('<!-- @roles -->', rolesHTML())
        .replace('<!-- @tariffs -->', tariffsMarkup())
        .replace('<!-- @stats -->', statsMarkup())
        .replace('<!-- @process -->', processHTML())
        .replace('<!-- @faq -->', faqHTML())
        .replace('<!-- @cta -->', ctaInnerHTML());
    },
  };
}

/** Preloads the two faces needed for the first screen (hashed names are known only after bundling). */
function preloadFonts(names: string[]): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((f) =>
          names.some((n) => f.includes(n) && f.endsWith('.woff2')),
        );
        return files.map((href) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: `./${href}`,
            as: 'font',
            type: 'font/woff2',
            crossorigin: '',
          },
          injectTo: 'head-prepend' as const,
        }));
      },
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  // build + preview: the Pages sub-path (preview then mirrors production URLs);
  // dev server: plain `/`
  base: command === 'build' || isPreview ? PAGES_BASE : '/',
  plugins: [dataMarkup(), preloadFonts(['space-grotesk-latin-500', 'inter-cyrillic-400'])],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    reportCompressedSize: true,
    // three.js lives in a lazy chunk (~136 kB gz) loaded after first paint
    chunkSizeWarningLimit: 600,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
}));
