#!/usr/bin/env node
/**
 * Content secret-scanning for the Claude Code secrets-guard PreToolUse hook.
 *
 * Why this is its own module: `secrets-guard.mjs` crossed the 350-code-line
 * ceiling in .claude/rules/scripts.md, and path-taxonomy ("is this file a
 * secret?") and content scanning ("does this text introduce a credential?") are
 * the two cohesive halves. This is the second; the first stays in the entry
 * module, which imports `scanForSecrets` from here.
 *
 * The assertion matrix lives in `secrets-guard.test.mjs` alongside the rest of
 * the guard, so `test:scripts` covers both halves through one public surface.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** Extension of a path, including the dot ("" when there is none). */
export const fileExtension = (name) =>
  name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';

// ---- content secret patterns ------------------------------------------------

// High-confidence, provider-specific formats. ReDoS-safe (no nested quantifiers
// over overlapping classes). Applied to EVERY write, regardless of file type.
const PROVIDER_PATTERNS = [
  {
    id: 'aws-access-key-id',
    description: 'AWS access key ID',
    re: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: 'github-token',
    description: 'GitHub token',
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/,
  },
  {
    id: 'github-fine-grained-pat',
    description: 'GitHub fine-grained PAT',
    re: /\bgithub_pat_\w{22,}\b/,
  },
  {
    id: 'openai-key',
    description: 'OpenAI-style secret key',
    re: /\bsk-(?:proj-)?[\w-]{20,}\b/,
  },
  {
    id: 'stripe-live-key',
    description: 'Stripe live key',
    re: /\b[rs]k_live_[A-Za-z0-9]{16,}\b/,
  },
  {
    id: 'slack-token',
    description: 'Slack token',
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    id: 'slack-webhook',
    description: 'Slack webhook URL',
    re: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]{20,}/,
  },
  {
    id: 'google-api-key',
    description: 'Google API key',
    re: /\bAIza[\w-]{35}\b/,
  },
  {
    id: 'google-oauth-token',
    description: 'Google OAuth token',
    re: /\bya29\.[\w-]{20,}/,
  },
  {
    id: 'npm-token',
    description: 'npm access token',
    re: /\bnpm_[A-Za-z0-9]{36}\b/,
  },
  {
    id: 'private-key',
    description: 'private key block',
    re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/,
  },
  {
    id: 'jwt',
    description: 'JSON Web Token',
    re: /\beyJ[\w-]{10,}\.eyJ[\w-]{6,}\.[\w-]{10,}\b/,
  },
];

// A quoted value of 16+ non-space chars. Linear, no backtracking — unlike a
// key+value regex whose unanchored identifier scan is quadratic (S8786). The
// key-name test is done in JS (below).
const QUOTED_VALUE = /["']([^"'\s]{16,})["']/g;
const ENV_ASSIGNMENT =
  /^\s*[A-Z][A-Z0-9_]{2,}\s*=\s*([A-Za-z0-9+/=._-]{20,})\s*$/;

// A module specifier is never a credential — but one naming a secret-related
// module is exactly the generic rule's shape: a long, high-entropy quoted
// string on a line containing "secret"/"token"/"password". Four committed
// source files match (`from '@lcabrera/server/crypto/is-secret-hash-valid.util'`
// and friends), so without this carve-out the guard blocks writing real code.
//
// Keyed on the syntactic POSITION — a `from` clause, `require(…)`, dynamic
// `import(…)` — rather than on the value looking path-like, because a base64
// credential also contains slashes and dots. Nothing can be smuggled through:
// an import specifier is resolved as a module, never read as a value.
const MODULE_SPECIFIER =
  /(?:\bfrom\s*|\b(?:require|import)\s*\(\s*)["']([^"'\s]+)["']/g;

// A path to a SOURCE file is never a credential, and one naming a secret-related
// script has the generic rule's exact shape — a long, high-entropy quoted string
// on a line containing "secret". `.claude/settings.json`'s hook command
// (`node "$CLAUDE_PROJECT_DIR/scripts/claude-secrets-guard.mjs"`) is the case
// that forced this: the guard blocked edits to its own wiring, and JSON has no
// comment syntax to carry the `gitleaks:allow` escape.
//
// Keyed on the EXTENSION, not on the value looking path-like — the module
// carve-out above explains why "has slashes and dots" is not safe (base64 has
// both). Base64 never ends in `.mjs`. Key material (`.pem`, `.key`, …) is
// deliberately absent: the test pairs one high-entropy path spelled `.mjs`
// against the same path spelled `.pem` to prove the extension is what decides.
const SOURCE_FILE_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.json',
  '.jsonc',
  '.jsx',
  '.md',
  '.mjs',
  '.mts',
  '.sh',
  '.ts',
  '.tsx',
]);

// The capture keeps a trailing escape backslash when the value sits inside an
// escaped string (`"node \"…/x.mjs\""` in JSON, the same in a shell command),
// which is exactly the context this carve-out exists for — so strip it before
// reading the extension. Done by index rather than a `/\\+$/` replace: a
// quantifier anchored at the end backtracks super-linearly on a long run of
// backslashes (Sonar S8786), and this is linear.
const withoutTrailingBackslashes = (value) => {
  let end = value.length;
  while (end > 0 && value[end - 1] === '\\') {
    end -= 1;
  }
  return value.slice(0, end);
};

const isSourceFilePathValue = (value) => {
  const unescaped = withoutTrailingBackslashes(value);
  return (
    unescaped.includes('/') &&
    SOURCE_FILE_EXTENSIONS.has(fileExtension(unescaped))
  );
};

// Key names (normalized: lowercased, separators stripped) that mark a value as
// credential-bearing when it is also high-entropy.
const SECRET_KEY_HINTS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'accesskey',
  'clientsecret',
  'privatekey',
  'authtoken',
  'credential',
];
// Value prefixes that mark an obvious placeholder rather than a real secret.
const PLACEHOLDER_WORDS = [
  'your',
  'my',
  'the',
  'a',
  'an',
  'example',
  'sample',
  'test',
  'dummy',
  'fake',
  'changeme',
  'placeholder',
  'redacted',
  'secret',
  'token',
  'password',
  'value',
  'todo',
  'none',
  'null',
  'undefined',
  'xxx',
  'foo',
  'bar',
];

const ALLOW_MARKER =
  /gitleaks:allow|pragma:\s*allowlist secret|secrets-guard:\s*allow/i;
const FORMAT_HINT = /[<>]|\$\{|\bhere\b/i;
const FILLER_ONLY = /^[x*.\s_-]+$/i;

const shannonEntropy = (value) => {
  const chars = [...value];
  const total = chars.length;
  if (total === 0) {
    return 0;
  }
  const counts = chars.reduce((acc, ch) => {
    acc.set(ch, (acc.get(ch) ?? 0) + 1);
    return acc;
  }, new Map());
  return [...counts.values()].reduce((entropy, count) => {
    const probability = count / total;
    return entropy - probability * Math.log2(probability);
  }, 0);
};

// `word` followed by a word boundary (mirrors the old /word\b/): the next char
// must be absent or a non-word char.
const startsWithWord = ({ text, word }) => {
  if (!text.startsWith(word)) {
    return false;
  }
  const nextChar = text.charAt(word.length);
  return nextChar === '' || /\W/.test(nextChar);
};

const isPlaceholderValue = (value) => {
  const lower = value.toLowerCase();
  return (
    value.length === 0 ||
    FORMAT_HINT.test(value) ||
    FILLER_ONLY.test(value) ||
    PLACEHOLDER_WORDS.some((word) => startsWithWord({ text: lower, word }))
  );
};

const looksLikeRealSecret = (value) =>
  value.length >= 16 &&
  !isPlaceholderValue(value) &&
  shannonEntropy(value) >= 4;

const genericSecretValue = (line) => {
  const envValue = ENV_ASSIGNMENT.exec(line)?.[1];
  if (envValue !== undefined && looksLikeRealSecret(envValue)) {
    return envValue;
  }
  const lower = line.toLowerCase();
  if (!SECRET_KEY_HINTS.some((hint) => lower.includes(hint))) {
    return undefined;
  }
  const specifiers = new Set(
    [...line.matchAll(MODULE_SPECIFIER)].map((match) => match[1]),
  );
  return [...line.matchAll(QUOTED_VALUE)]
    .map((match) => match[1])
    .find(
      (value) =>
        !specifiers.has(value) &&
        !isSourceFilePathValue(value) &&
        looksLikeRealSecret(value),
    );
};

// Paths where the entropy-based generic rules do more harm than good: test
// fixtures, doc/decision records, and the secret-guard sources themselves all
// legitimately contain secret-shaped literals.
const isGenericScanExempt = (filePath) => {
  const value = String(filePath);
  return (
    /\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(value) ||
    value.includes('/decisions/') ||
    /secrets?[_-]?guard/i.test(value) ||
    value.includes('isSecretFilePath') ||
    value.includes('collectToolInputPaths')
  );
};

const matchLine = ({ allowGeneric, line, lineNumber }) => {
  if (ALLOW_MARKER.test(line)) {
    return [];
  }
  const providerHits = PROVIDER_PATTERNS.filter((rule) =>
    rule.re.test(line),
  ).map((rule) => ({
    description: rule.description,
    line: lineNumber,
    ruleId: rule.id,
  }));
  if (!allowGeneric || genericSecretValue(line) === undefined) {
    return providerHits;
  }
  return [
    ...providerHits,
    {
      description: 'hardcoded secret',
      line: lineNumber,
      ruleId: 'generic-secret',
    },
  ];
};

/** Scan write content; returns one finding per matched line/rule. */
export const scanForSecrets = ({ filePath, text }) => {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }
  const allowGeneric = !isGenericScanExempt(filePath);
  return text
    .split('\n')
    .flatMap((line, index) =>
      matchLine({ allowGeneric, line, lineNumber: index + 1 }),
    );
};
