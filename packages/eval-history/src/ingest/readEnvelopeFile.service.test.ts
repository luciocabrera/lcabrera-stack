import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { readEnvelopeFile } from './readEnvelopeFile.service.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const text = JSON.stringify(fixtures.get('skills.json'));

const bytesOf = (content: string) => async () =>
  new TextEncoder().encode(content);

describe('readEnvelopeFile', () => {
  it('returns the envelope with the SHA-256 of the bytes read', async () => {
    const result = await readEnvelopeFile({
      file: 'run.json',
      readBytes: bytesOf(text),
    });

    expect(result).toMatchObject({
      file: 'run.json',
      ok: true,
      sha256: createHash('sha256').update(text).digest('hex'),
    });
    expect(result.ok && result.envelope.run.suite).toBe('skills');
  });

  it('rejects a file it cannot read, naming the reason', async () => {
    expect(
      await readEnvelopeFile({
        file: 'locked.json',
        readBytes: async () => {
          throw Object.assign(new Error('EISDIR: illegal operation'), {
            code: 'EISDIR',
          });
        },
      }),
    ).toEqual({
      file: 'locked.json',
      ok: false,
      problems: ['could not read: EISDIR: illegal operation'],
    });
  });

  it('rejects a file that is not JSON', async () => {
    const result = await readEnvelopeFile({
      file: 'broken.json',
      readBytes: bytesOf('{'),
    });

    expect(result.ok ? [] : result.problems[0]).toMatch(/^not JSON: /u);
  });

  it('rejects an unsupported version, naming it', async () => {
    expect(
      await readEnvelopeFile({
        file: 'old.json',
        readBytes: bytesOf('{"schema_version": -1}'),
      }),
    ).toEqual({
      file: 'old.json',
      ok: false,
      problems: [
        expect.stringMatching(/^schema_version -1 is not supported: /u),
      ],
    });
  });
});
