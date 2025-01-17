import { defineConfig } from 'astro/config';
import postcssConfig from './postcss.config.mjs';

export default defineConfig({
  vite: {
    css: {
      postcss: postcssConfig
    }
  }
});