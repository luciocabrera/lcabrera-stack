import { describe, expect, it } from 'vite-plus/test';

import { scrubSecrets, secretEnvValues } from './transcript-scrub.mjs';

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

  it('redacts the value of an environment variable whose name marks it secret', () => {
    const env = {
      CLAUDE_CODE_OAUTH_TOKEN: 'opaque-value-with-no-known-shape',
      EVALS_DATABASE_URL: 'postgres://u:p@h/db',
      HOME: '/home/runner/work',
    };
    expect(
      scrubSecrets(
        'token=opaque-value-with-no-known-shape url=postgres://u:p@h/db home=/home/runner/work',
        { env },
      ),
    ).toBe('token=[REDACTED:env] url=[REDACTED:env] home=/home/runner/work');
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
