export const createReactRouterRunConfig = () => ({
  tasks: {
    build: {
      cache: true,
      // Pin NODE_ENV so StyleX plugin mode is stable across all shell environments.
      // Exclude build output and generated types from the input fingerprint — without
      // this, files written by react-router build would be tracked as inputs on the
      // next run, causing guaranteed cache misses.
      command: 'NODE_ENV=production react-router build',
      env: ['NODE_ENV'],
      input: [
        { auto: true },
        '!build/**',
        '!.react-router/**',
        '!node_modules/.vite-temp/**',
      ],
    },
    start: {
      command:
        'if [ ! -f ./build/server/index.js ]; then react-router build; fi && react-router-serve ./build/server/index.js',
    },
    test: {
      cache: false,
      command: 'node node_modules/vitest/vitest.mjs run',
    },
  },
});
