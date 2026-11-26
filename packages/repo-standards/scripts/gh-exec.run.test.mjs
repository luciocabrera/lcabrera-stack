import { execFileSync } from 'node:child_process';
import { describe, expect, it, vi } from 'vite-plus/test';

import { runGh } from './gh-exec.mjs';

vi.mock('node:fs', () => ({ existsSync: () => true }));
vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(() => ' out \n'),
}));

const lastOptions = () => vi.mocked(execFileSync).mock.lastCall?.[2];

describe('runGh', () => {
  it('spawns the first trusted gh and trims what it prints', () => {
    expect(runGh(['issue', 'list'])).toBe('out');
    expect(vi.mocked(execFileSync).mock.lastCall?.slice(0, 2)).toStrictEqual([
      '/usr/local/bin/gh',
      ['issue', 'list'],
    ]);
  });

  it('closes stdin when there is nothing to send', () => {
    runGh(['issue', 'list']);
    expect(lastOptions()).toMatchObject({
      input: undefined,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  });

  it('pipes the input it is given to stdin', () => {
    runGh(['issue', 'create', '--body-file', '-'], { input: 'body' });
    expect(lastOptions()).toMatchObject({
      input: 'body',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  });
});
