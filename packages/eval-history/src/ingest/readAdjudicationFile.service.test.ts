import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { readAdjudicationFile } from './readAdjudicationFile.service.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const text = JSON.stringify(fixtures.get('adjudication.json'));
const runText = JSON.stringify(fixtures.get('skills.json'));
const futureText = JSON.stringify({ schema_version: 9 });

const bytesOf = (content: string) => async () =>
  new TextEncoder().encode(content);

describe('readAdjudicationFile', () => {
  it('returns the case with the SHA-256 of the bytes read', async () => {
    const result = await readAdjudicationFile({
      file: 'FP-0001.json',
      readBytes: bytesOf(text),
    });

    expect(result).toMatchObject({
      file: 'FP-0001.json',
      ok: true,
      sha256: createHash('sha256').update(text).digest('hex'),
    });
    expect(result.ok && result.envelope.case.case_id).toBe('FP-0001');
  });

  it('rejects a file that is not JSON', async () => {
    const result = await readAdjudicationFile({
      file: 'FP-0002.json',
      readBytes: bytesOf('{'),
    });

    expect(result.ok ? [] : result.problems[0]).toMatch(/^not JSON: /u);
  });

  it('rejects a run envelope, naming the fields a case needs', async () => {
    const result = await readAdjudicationFile({
      file: 'FP-0003.json',
      readBytes: bytesOf(runText),
    });

    expect(result.ok ? [] : result.problems).toEqual([
      'case: Invalid input: expected object, received undefined',
      'outcome: Invalid option: expected one of "dismissed"|"fixed"|"split"|"escalated"',
      'verifiers: Invalid input: expected array, received undefined',
    ]);
  });

  it('rejects a version it does not read, naming it', async () => {
    expect(
      await readAdjudicationFile({
        file: 'FP-0004.json',
        readBytes: bytesOf(futureText),
      }),
    ).toEqual({
      file: 'FP-0004.json',
      ok: false,
      problems: [
        'schema_version 9 is not supported: this ingester reads version 1 (ADR-131)',
      ],
    });
  });
});
