export const runConfig = {
  tasks: {
    build: {
      command: 'react-router build',
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
};
