import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function githubPagesSpaPlugin(): Plugin {
  return {
    name: 'github-pages-spa-plugin',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtml = path.join(distDir, 'index.html');
      const notFoundHtml = path.join(distDir, '404.html');
      const noJekyll = path.join(distDir, '.nojekyll');
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, notFoundHtml);
        fs.writeFileSync(noJekyll, '');
      }
    },
  };
}

export default defineConfig(({command}) => {
  return {
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss(), githubPagesSpaPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
