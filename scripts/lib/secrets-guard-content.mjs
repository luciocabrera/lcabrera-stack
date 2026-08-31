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

const QUOTED_VALUE = /["']([^"'\s]{16,})["']/g;
const ENV_ASSIGNMENT =
  /^\s*[A-Z][A-Z0-9_]{2,}\s*=\s*([A-Za-z0-9+/=._-]{20,})\s*$/;

const MODULE_SPECIFIER =
  /(?:\bfrom\s*|\b(?:require|import)\s*\(\s*)["']([^"'\s]+)["']/g;

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

const withoutTrailingBackslashes = (value) => {
  let end = value.length;
  while (end > 0 && value[end - 1] === '\\') {
    end -= 1;
  }
  return value.slice(0, end);
};

const PATH_SEPARATOR = /[/\\]/;

const isSourceFilePathValue = (value) => {
  const unescaped = withoutTrailingBackslashes(value);
  if (!SOURCE_FILE_EXTENSIONS.has(fileExtension(unescaped))) {
    return false;
  }
  const segments = unescaped.split(PATH_SEPARATOR).filter(Boolean);
  return segments.length >= 2 && !segments.some(looksLikeRealSecret);
};

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
