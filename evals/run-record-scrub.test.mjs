import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import {
  rulesPlan,
  rulesTrial,
  STARTED_AT,
  testIdentity,
} from './envelope-test-support.mjs';
import { recordRun, saveTranscript } from './run-record.mjs';

const PLANTED_ENV = {
  CLAUDE_CODE_OAUTH_TOKEN: 'opaque-oauth-value-0123456789',
  EVALS_DATABASE_URL:
    'postgres://evals_writer:hunter2-pw@db.example:5432/evals',
  EVALS_MIGRATE_DATABASE_URL:
    'postgres://evals_owner:owner-pw@db.example:5432/evals',
};
const PLANTED_TOKEN = ['ghp', 'a1B2'.repeat(9)].join('_');
const PLANTED_TEXT = JSON.stringify(
  [
    { content: `$ env\nEVALS_DATABASE_URL=${PLANTED_ENV.EVALS_DATABASE_URL}` },
    {
      content: `EVALS_MIGRATE_DATABASE_URL=${PLANTED_ENV.EVALS_MIGRATE_DATABASE_URL}`,
    },
    { content: `oauth ${PLANTED_ENV.CLAUDE_CODE_OAUTH_TOKEN}` },
    { content: 'remote https://ci:other-pw@git.example/repo.git' },
    { content: `token ${PLANTED_TOKEN}` },
  ],
  null,
  2,
);

const sha256Of = (bytes) => createHash('sha256').update(bytes).digest('hex');

let resultsDir;

beforeEach(() => {
  resultsDir = mkdtempSync(join(tmpdir(), 'eval-results-'));
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(resultsDir, { force: true, recursive: true });
});

describe('a transcript with secrets in it', () => {
  it('is written redacted, and the envelope records the size and hash of that file', async () => {
    const outcome = await recordRun({
      clock: () => STARTED_AT + 2000,
      env: PLANTED_ENV,
      execute: ({ addTrial, transcript }) => {
        addTrial({
          ...rulesTrial,
          transcript: transcript({ name: 'planted.json', text: PLANTED_TEXT }),
        });
      },
      identity: testIdentity,
      ingest: async () => undefined,
      plan: rulesPlan,
      resultsDir,
      signals: new EventEmitter(),
    });
    const [recorded] = JSON.parse(readFileSync(outcome.file, 'utf8')).trials;
    const onDisk = readFileSync(recorded.transcript.uri);
    const scrubbed = onDisk.toString('utf8');
    for (const secret of [
      PLANTED_ENV.EVALS_DATABASE_URL,
      'hunter2-pw',
      PLANTED_ENV.EVALS_MIGRATE_DATABASE_URL,
      'owner-pw',
      PLANTED_ENV.CLAUDE_CODE_OAUTH_TOKEN,
      'other-pw',
      PLANTED_TOKEN,
    ]) {
      expect(scrubbed).not.toContain(secret);
    }
    expect(scrubbed).toContain(
      'https://ci:[REDACTED:url-password]@git.example',
    );
    expect(scrubbed).toContain('[REDACTED:github-token]');
    expect(recorded.transcript).toMatchObject({
      bytes: onDisk.length,
      sha256: sha256Of(onDisk),
    });
    expect(outcome.envelope.trials[0].transcript).toStrictEqual(
      recorded.transcript,
    );
  });
});

describe('a transcript with no secret in it', () => {
  it('is written byte for byte, with the hash of the text it was given', () => {
    const text = JSON.stringify(
      [{ content: 'Read https://github.com/org/repo/blob/main/a.ts' }],
      null,
      2,
    );
    const transcript = saveTranscript({
      env: PLANTED_ENV,
      name: 'clean.json',
      resultsDir,
      runId: testIdentity.run_id,
      suite: 'skills',
      text,
    });
    const given = Buffer.from(text, 'utf8');
    expect(readFileSync(transcript.uri)).toStrictEqual(given);
    expect(transcript).toMatchObject({
      bytes: given.length,
      sha256: sha256Of(given),
    });
  });
});
