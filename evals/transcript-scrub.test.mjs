import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  scrubSecrets,
  secretEnvValues,
  writeScrubbed,
} from './transcript-scrub.mjs';

const EVALS_DIR = dirname(fileURLToPath(import.meta.url));
const RAW_WRITE =
  /\b(?:writeFileSync|appendFileSync|createWriteStream|writeFile|appendFile)\b|node:fs\/promises/;

const GITHUB_TOKEN = ['ghp', 'a1B2'.repeat(9)].join('_');
const JWT = ['eyJ', 'eyJ', '']
  .map((head) => `${head}${'Q9_z'.repeat(5)}`)
  .join('.');
const KEY_LINE = (edge) => `-----${edge} OPENSSH PRIVATE KEY-----`;
const PRIVATE_KEY = [
  KEY_LINE('BEGIN'),
  'b3BlbnNzaC1rZXk',
  KEY_LINE('END'),
].join('\\n');

describe('scrubSecrets', () => {
  it('redacts the password in a URL and keeps the rest of it', () => {
    expect(
      scrubSecrets('postgres://writer:s3cr%40t-pw@db.internal:5432/evals', {
        env: {},
      }),
    ).toBe('postgres://writer:[REDACTED:url-password]@db.internal:5432/evals');
  });

  it.each([
    [
      'a password containing an unencoded @',
      'postgres://u:p@ssw0rd123@h:5432/db',
      'postgres://u:[REDACTED:url-password]@h:5432/db',
    ],
    [
      'a password with no user',
      'redis://:hunter2-pw@cache.internal:6379/0',
      'redis://:[REDACTED:url-password]@cache.internal:6379/0',
    ],
    [
      'a password in a URL inside JSON',
      '{"url":"https://ci:other-pw@git.example/repo.git"}',
      '{"url":"https://ci:[REDACTED:url-password]@git.example/repo.git"}',
    ],
  ])('redacts %s', (_case, text, expected) => {
    const scrubbed = scrubSecrets(text, { env: {} });
    expect(scrubbed).toBe(expected);
    expect(scrubbed).not.toMatch(/ssw0rd123|hunter2-pw|other-pw/);
  });

  it('redacts the value of an AWS secret access key by its variable name', () => {
    const value = 'wJalrXUtnFEMI-K7MDENG-bPxRfiCYEXAMPLEKEY';
    expect(
      scrubSecrets(`aws ${value}`, { env: { AWS_SECRET_ACCESS_KEY: value } }),
    ).toBe('aws [REDACTED:env]');
  });

  it('redacts the value of an environment variable whose name marks it secret', () => {
    const env = {
      CLAUDE_CODE_OAUTH_TOKEN: 'opaque-value-with-no-known-shape',
      EVALS_DATABASE_URL: 'postgres://u:p@h/db',
      EVALS_MIGRATE_DATABASE_URL: 'postgres://owner:p@h/db',
      HOME: '/home/runner/work',
    };
    expect(
      scrubSecrets(
        'token=opaque-value-with-no-known-shape url=postgres://u:p@h/db migrate=postgres://owner:p@h/db home=/home/runner/work',
        { env },
      ),
    ).toBe(
      'token=[REDACTED:env] url=[REDACTED:env] migrate=[REDACTED:env] home=/home/runner/work',
    );
  });

  it('redacts a secret value as it appears inside a JSON string', () => {
    const env = { SERVICE_PASSWORD: 'quote"and\\slash' };
    const text = JSON.stringify({ output: 'pw is quote"and\\slash' });
    expect(scrubSecrets(text, { env })).toBe(
      JSON.stringify({ output: 'pw is [REDACTED:env]' }),
    );
  });

  it.each([
    ['github-token', GITHUB_TOKEN],
    ['github-token', ['github', 'pat', 'Ab1x'.repeat(8)].join('_')],
    ['api-key', ['sk', 'ant', 'api03', 'x9Y'.repeat(8)].join('-')],
    ['npm-token', ['npm', 'Zz09'.repeat(9)].join('_')],
    ['aws-access-key', `AKIA${'Q7'.repeat(8)}`],
    ['slack-token', ['xoxb', '1234567890', 'abcdefghij'].join('-')],
    ['jwt', JWT],
    ['private-key', PRIVATE_KEY],
  ])('redacts a %s-shaped string', (kind, secret) => {
    expect(scrubSecrets(`before ${secret} after`, { env: {} })).toBe(
      `before [REDACTED:${kind}] after`,
    );
  });

  it('returns text with no secret in it unchanged', () => {
    const text = JSON.stringify(
      [
        { content: 'Read https://github.com/org/repo/blob/main/a.ts:12' },
        { content: 'risk-assessment task-runner ghp_short sk-short' },
        { content: 'mailto:user@example.com and git@github.com:org/repo' },
      ],
      null,
      2,
    );
    expect(scrubSecrets(text, { env: { HOME: '/home/runner' } })).toBe(text);
  });

  it('is unchanged by a second pass', () => {
    const env = { API_KEY: 'value-of-the-key' };
    const once = scrubSecrets(`postgres://u:pw@h/db ${GITHUB_TOKEN} ${JWT}`, {
      env,
    });
    expect(scrubSecrets(once, { env })).toBe(once);
  });
});

describe('secretEnvValues', () => {
  it('ignores a short value and a variable whose name marks no secret', () => {
    expect(
      secretEnvValues({ GITHUB_TOKEN: 'short', PATH: '/usr/bin:/bin' }),
    ).toStrictEqual([]);
  });

  it('orders values longest first, so a value inside another is not split', () => {
    expect(
      secretEnvValues({ A_TOKEN: 'abcdefgh', B_TOKEN: 'abcdefgh-longer' }),
    ).toStrictEqual(['abcdefgh-longer', 'abcdefgh']);
  });
});

describe('writeScrubbed', () => {
  it('writes the scrubbed text and returns the bytes it wrote', () => {
    const directory = mkdtempSync(join(tmpdir(), 'scrubbed-'));
    try {
      const file = join(directory, 'trials.json');
      const bytes = writeScrubbed({
        env: { EVALS_DATABASE_URL: 'postgres://u:pw-value@h/db' },
        file,
        text: JSON.stringify([
          { error: 'connect failed: postgres://u:pw-value@h/db' },
        ]),
      });
      expect(readFileSync(file)).toStrictEqual(bytes);
      expect(bytes.toString('utf8')).toBe(
        JSON.stringify([{ error: 'connect failed: [REDACTED:env]' }]),
      );
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});

describe('runner output', () => {
  const writers = readdirSync(EVALS_DIR, { recursive: true })
    .filter((path) => !path.startsWith('node_modules'))
    .filter(
      (path) =>
        /^verify-.*\.mjs$/.test(basename(path)) || path === 'run-record.mjs',
    );

  it('finds every runner', () => {
    expect(writers).toStrictEqual(
      expect.arrayContaining([
        'run-record.mjs',
        join('skill-quality', 'verify-skill-quality.mjs'),
        join('skills', 'verify-skill-triggers.mjs'),
        join('verifier-fixtures', 'verify-verifier-tooled.mjs'),
        join('verifier-fixtures', 'verify-verifier-verdicts.mjs'),
      ]),
    );
  });

  it.each(writers)('%s writes files only through writeScrubbed', (path) => {
    expect(readFileSync(join(EVALS_DIR, path), 'utf8')).not.toMatch(RAW_WRITE);
  });
});
