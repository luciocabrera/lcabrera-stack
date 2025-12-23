import stylex from '@stylexjs/unplugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// const rootDir = fileURLToPath(new URL('.', import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    stylex.vite({
      aliases: {
        '@/*': [fileURLToPath(new URL('src/*', import.meta.url))],
      },
      dev: process.env.NODE_ENV === 'development',
      // unstable_moduleResolution: {
      //   rootDir,
      //   type: 'commonJS',
      // },
      useCSSLayers: true,
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
});
