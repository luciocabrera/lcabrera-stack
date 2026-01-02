import { reactRouter } from '@react-router/dev/vite';
import stylex from '@stylexjs/unplugin';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';

export default defineConfig({
  plugins: [
    stylex.vite({
      aliases: {
        '@/*': [fileURLToPath(new URL('src/*', import.meta.url))],
      },
      dev: process.env.NODE_ENV === 'development',
      useCSSLayers: true,
    }),
    reactRouter(),
    babel({
      babelConfig: {
        plugins: [['babel-plugin-react-compiler']],
        presets: ['@babel/preset-typescript'],
      },
      filter: /\.[jt]sx?$/,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:3001',
      },
    },
  },
});
