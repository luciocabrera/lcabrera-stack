/**
 * The fake effects `repo-fallow-gate`'s command tests run against, shared by
 * the test files that split its cases.
 */
export const fakeEffects = ({
  diff = { status: 0, stdout: '' },
  existing = ['a.ts', 'b.ts', 'packages/ui/src/c.ts', 'scripts/d.mjs', 'e.ts'],
  falsePositives = [],
  replies = [],
  stdinFiles = [],
  workspaceDirs = ['packages/ui'],
} = {}) => {
  const calls = [];
  const out = [];
  const err = [];
  const queue = [...replies];
  return {
    calls,
    effects: {
      exists: (file) => existing.includes(file),
      git: (args) => {
        calls.push({ git: args });
        return diff;
      },
      readFalsePositives: () => falsePositives,
      readStdinFiles: () => stdinFiles,
      root: '/repo',
      spawn: (args, stdout) => {
        calls.push({ args, stdout });
        return queue.shift() ?? { status: 0, stdout: '' };
      },
      today: () => '2026-10-30',
      workspaceDirs: () => workspaceDirs,
      write: (text) => {
        out.push(text);
      },
      writeError: (text) => {
        err.push(text);
      },
    },
    err,
    out,
  };
};

export const json = (value) => ({ status: 0, stdout: JSON.stringify(value) });
