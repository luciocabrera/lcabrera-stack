import { describe, expect, it } from 'vite-plus/test';

import { refusalMarkdown } from './refusalMarkdown.util.ts';

const side = {
  branch: 'main',
  gitSha: 'a'.repeat(40),
  modelId: 'model-a',
  runId: 'run-a',
  suite: 'skills',
} as const;

describe('refusalMarkdown', () => {
  it('heads the refusal with the suite and both sides, then says why', () => {
    const [heading, reason] = refusalMarkdown({
      a: side,
      b: { ...side, branch: 'feat/x', modelId: 'model-b' },
      kind: 'refused',
      reason: 'model-changed',
      suite: 'skills',
    }).split('\n\n', 2);

    expect(heading).toBe('### skills: feat/x vs main: not compared');
    expect(reason).toContain('`model-b`');
  });
});
