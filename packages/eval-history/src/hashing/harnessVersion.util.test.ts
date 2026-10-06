import { describe, expect, it } from 'vite-plus/test';

import { fileSetHash } from './fileSetHash.util.ts';
import { harnessVersion } from './harnessVersion.util.ts';

describe('harnessVersion', () => {
  it('is the first 12 hex characters of the file-set hash', () => {
    const files = [{ bytes: 'export {};\n', path: 'evals/agent-sessions.mjs' }];

    expect(harnessVersion(files)).toBe(fileSetHash(files).slice(0, 12));
    expect(harnessVersion(files)).toMatch(/^[0-9a-f]{12}$/u);
  });
});
