/**
 * Redacts secret-shaped text from every file an eval runner writes, because
 * the files under `.tmp/` are uploaded as artifacts of a public repository and
 * a session's tool output can echo an environment. Three kinds are matched:
 * the value of any environment variable whose name marks it secret, the
 * password in a URL, and known token shapes. Text with none of them is
 * written unchanged. `writeScrubbed` is the one writer for a runner's output.
 * Usage: imported by `run-record.mjs` and by every runner under `evals/`.
 */
import { writeFileSync } from 'node:fs';

const SECRET_ENV_NAME =
  /(?:TOKEN|SECRET|PASSWORD|PASSWD|PASSPHRASE|API_?KEY|ACCESS_KEY|PRIVATE_KEY|CREDENTIALS?|DATABASE_URL|_DSN)$/i;
const MIN_SECRET_LENGTH = 8;

const URL_PASSWORD =
  /\b([a-z][a-z\d+.-]*:\/\/[^\s:@/?#"'\\]*):[^\s/?#"'\\]+@/gi;

const TOKEN_SHAPES = [
  [
    'private-key',
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  ],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z\d]{36,}|github_pat_\w{22,})/g],
  ['api-key', /\bsk-(?:ant-)?[\w-]{20,}/g],
  ['npm-token', /\bnpm_[A-Za-z\d]{36,}/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z\d]{16}\b/g],
  ['slack-token', /\bxox[abprs]-[A-Za-z\d-]{10,}/g],
  ['jwt', /\beyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/g],
];

const marker = (kind) => `[REDACTED:${kind}]`;

const jsonEscaped = (value) => JSON.stringify(value).slice(1, -1);

export const secretEnvValues = (env) =>
  [
    ...new Set(
      Object.entries(env)
        .filter(([name]) => SECRET_ENV_NAME.test(name))
        .map(([, value]) => value)
        .filter(
          (value) =>
            typeof value === 'string' && value.length >= MIN_SECRET_LENGTH,
        )
        .flatMap((value) => [value, jsonEscaped(value)]),
    ),
  ].toSorted((left, right) => right.length - left.length);

const redactValues = (text, values) =>
  values.reduce(
    (scrubbed, value) => scrubbed.replaceAll(value, marker('env')),
    text,
  );

const redactUrlPasswords = (text) =>
  text.replace(URL_PASSWORD, `$1:${marker('url-password')}@`);

const redactTokens = (text) =>
  TOKEN_SHAPES.reduce(
    (scrubbed, [kind, pattern]) => scrubbed.replace(pattern, marker(kind)),
    text,
  );

export const scrubSecrets = (text, { env = process.env } = {}) =>
  redactTokens(redactUrlPasswords(redactValues(text, secretEnvValues(env))));

export const writeScrubbed = ({ env = process.env, file, text }) => {
  const bytes = Buffer.from(scrubSecrets(text, { env }), 'utf8');
  writeFileSync(file, bytes);
  return bytes;
};
