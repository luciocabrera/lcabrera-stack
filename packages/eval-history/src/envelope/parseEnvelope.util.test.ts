import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { parseEnvelope } from './parseEnvelope.util.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';

const fixture = async () => {
  const files = await readJsonFiles({
    directory: fileURLToPath(new URL('fixtures', import.meta.url)),
  });

  return files.get('skills.json');
};

describe('parseEnvelope', () => {
  it('returns the envelope when it is valid', async () => {
    const result = parseEnvelope(await fixture());

    expect(result.ok).toBe(true);
    expect(result.ok && result.envelope.run.suite).toBe('skills');
  });

  it('returns the issues when it is not', () => {
    const result = parseEnvelope({ schema_version: 1 });

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.issues.map(({ path }) => path[0])).toEqual([
      'run',
      'subjects',
      'tasks',
      'trials',
    ]);
  });
});
