import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, {recursive: true});
  for (const entry of fs.readdirSync(src, {withFileTypes: true})) {
    if (entry.name === 'aistudio') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function githubPagesSpaPlugin(): Plugin {
  return {
    name: 'github-pages-spa-plugin',
    closeBundle() {
      const rootDir = __dirname;
      const distDir = path.resolve(rootDir, 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;

      // 1. Clean raw-branch fallback script from built dist/index.html
      const rawBuiltHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      const cleanBuiltHtml = rawBuiltHtml.replace(
        /\s*<script data-gh-fallback>[\s\S]*?<\/script>/g,
        ''
      );
      fs.writeFileSync(indexHtmlPath, cleanBuiltHtml, 'utf8');
      fs.writeFileSync(path.join(distDir, '404.html'), cleanBuiltHtml, 'utf8');
      fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');

      // 2. Populate /gh-bundle/ so GitHub Pages "Deploy from branch: main / (root)" works with zero config
      const distAssetsDir = path.join(distDir, 'assets');
      const ghBundleDir = path.resolve(rootDir, 'gh-bundle');
      fs.rmSync(ghBundleDir, {recursive: true, force: true});
      fs.mkdirSync(ghBundleDir, {recursive: true});

      if (fs.existsSync(distAssetsDir)) {
        for (const entry of fs.readdirSync(distAssetsDir, {withFileTypes: true})) {
          if (!entry.isFile()) continue;
          const srcFile = path.join(distAssetsDir, entry.name);
          if (/^index-.*\.js$/.test(entry.name)) {
            fs.copyFileSync(srcFile, path.join(ghBundleDir, 'app.js'));
          } else if (/^index-.*\.css$/.test(entry.name)) {
            fs.copyFileSync(srcFile, path.join(ghBundleDir, 'app.css'));
          } else {
            fs.copyFileSync(srcFile, path.join(ghBundleDir, entry.name));
          }
        }
      }

      // 3. Populate /docs/ so GitHub Pages "Deploy from branch: main /docs" also works directly
      const docsDir = path.resolve(rootDir, 'docs');
      fs.rmSync(docsDir, {recursive: true, force: true});
      copyDirRecursive(distDir, docsDir);

      // 4. Write root .nojekyll and 404.html for main-branch static serving
      fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf8');
      const rootIndexHtml = path.join(rootDir, 'index.html');
      if (fs.existsSync(rootIndexHtml)) {
        fs.copyFileSync(rootIndexHtml, path.join(rootDir, '404.html'));
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
