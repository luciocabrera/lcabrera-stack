/**
 * Pure decision core for the Claude Code secrets-guard PreToolUse hook.
 *
 * Why this exists: the harness must be structurally unable to (a) read a
 * secret/.env file or (b) write a file that introduces a credential — a policy
 * that AGENTS.md §6 states but nothing enforced at the tool boundary for the
 * interactive Claude Code CLI (ADR-020's guard covers only the agent-runner SDK
 * runtime). This module is the pure brain: given a PreToolUse payload it returns
 * an allow/deny decision, with no I/O, so it is trivially unit-testable and the
 * entry script (`claude-secrets-guard.mjs`) stays a thin stdin→stdout shell.
 *
 * The secret-file policy is the SAME as ADR-020
 * (packages/agent-runner/src/isSecretFilePath.util.ts) — the two guards must
 * agree on what "secret" means. It is an INDEPENDENT implementation, not a
 * shared module: the CLI hook is bare-node `.mjs` and the SDK guard is TS, so
 * sharing one module would couple a security control to another package's
 * internals or to the experimental TS loader. Each runtime is instead locked to
 * the shared spec by its own tests (here: the entry's `--selftest`, mirroring
 * secretFileGuardHook.util.test.ts). Keep the taxonomy VALUES in sync.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { basename } from 'node:path';

// ---- secret-file taxonomy (spec: ADR-020) -----------------------------------

const SECRET_FILE = {
  // `.env.<suffix>` variants that are templates by convention, never real
  // credentials — the only carve-outs from the .env family.
  envTemplateSuffixes: ['.example', '.sample', '.template'],
  credentialBasenames: [
    '.dockercfg',
    '.envrc',
    '.git-credentials',
    '.netrc',
    '.npmrc',
    '.pgpass',
    'credentials',
    'credentials.json',
  ],
  keyMaterialExtensions: ['.key', '.p12', '.pem', '.pfx'],
  sshKeyPrefixes: ['id_dsa', 'id_ecdsa', 'id_ed25519', 'id_rsa'],
};

const fileExtension = (name) =>
  name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';

/** Name-based: does this path point at a credential-bearing file? */
const isSecretFilePath = (candidate) => {
  const name = basename(String(candidate).trim()).toLowerCase();
  if (name.length === 0) {
    return false;
  }
  if (name === '.env' || name.endsWith('.env') || name.startsWith('.env.')) {
    const suffix = name.startsWith('.env.') ? name.slice('.env'.length) : '';
    return !SECRET_FILE.envTemplateSuffixes.includes(suffix);
  }
  return (
    SECRET_FILE.credentialBasenames.includes(name) ||
    SECRET_FILE.sshKeyPrefixes.some((prefix) => name.startsWith(prefix)) ||
    SECRET_FILE.keyMaterialExtensions.includes(fileExtension(name))
  );
};

// ---- per-tool candidate paths (spec: ADR-020) -------------------------------

// Grep's `pattern` is deliberately absent — it is a CONTENT regex (grepping
// source for the string ".env" is legitimate); its glob/path fields are paths.
const TOOL_PATH_FIELDS = {
  Glob: ['path', 'pattern'],
  Grep: ['glob', 'path'],
  Read: ['file_path'],
};
// Split a Bash command into tokens; `=` is a separator so `--env-file=.env`
// yields the `.env` token.
const BASH_TOKEN_SPLIT = /[\s"'`;|&<>()=]+/;
const GLOB_WILDCARDS = /[*?[\]]/g;

const candidatePathsFor = ({ toolInput, toolName }) => {
  if (!toolInput || typeof toolInput !== 'object') {
    return [];
  }
  if (toolName === 'Bash') {
    const command =
      typeof toolInput.command === 'string' ? toolInput.command : '';
    return command.split(BASH_TOKEN_SPLIT).filter((token) => token.length > 0);
  }
  return (TOOL_PATH_FIELDS[toolName] ?? [])
    .map((field) => toolInput[field])
    .filter((value) => typeof value === 'string')
    .map((value) => value.replace(GLOB_WILDCARDS, ''));
};

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

// A `key = "value"` / `"key": "value"` assignment. The key-name test is done in
// JS (below), not baked into a huge regex alternation — simpler and extensible.
const ASSIGNMENT = /([A-Za-z][\w-]*)["']?\s*[:=]\s*["']([^"'\s]{16,})["']/;
const ENV_ASSIGNMENT =
  /^\s*[A-Z][A-Z0-9_]{2,}\s*=\s*([A-Za-z0-9+/=._-]{20,})\s*$/;

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
  const assignment = ASSIGNMENT.exec(line);
  if (assignment) {
    const normalizedKey = assignment[1].toLowerCase().replace(/[_-]/g, '');
    const value = assignment[2];
    if (
      SECRET_KEY_HINTS.some((hint) => normalizedKey.includes(hint)) &&
      looksLikeRealSecret(value)
    ) {
      return value;
    }
  }
  const envValue = ENV_ASSIGNMENT.exec(line)?.[1];
  return envValue !== undefined && looksLikeRealSecret(envValue)
    ? envValue
    : undefined;
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
const scanForSecrets = ({ filePath, text }) => {
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

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit']);

const extractWriteContent = ({ toolInput, toolName }) => {
  if (!toolInput || typeof toolInput !== 'object') {
    return '';
  }
  if (toolName === 'Write') {
    return typeof toolInput.content === 'string' ? toolInput.content : '';
  }
  if (toolName === 'Edit') {
    return typeof toolInput.new_string === 'string' ? toolInput.new_string : '';
  }
  const edits = Array.isArray(toolInput.edits) ? toolInput.edits : [];
  return edits
    .map((edit) =>
      edit && typeof edit.new_string === 'string' ? edit.new_string : '',
    )
    .join('\n');
};

/**
 * The one public entry point. Returns `{ decision: 'allow' }` or
 * `{ decision: 'deny', reason }`. Pure — no reads, no process, no throws for a
 * well-formed payload.
 */
export const evaluatePreToolUse = ({ hookEventName, toolInput, toolName }) => {
  if (hookEventName !== 'PreToolUse') {
    return { decision: 'allow' };
  }

  // 1) Deterministic read/exfil guard — Read/Grep/Glob and Bash tokens.
  const blockedPath = candidatePathsFor({ toolInput, toolName }).find(
    (candidate) => isSecretFilePath(candidate),
  );
  if (blockedPath !== undefined) {
    return {
      decision: 'deny',
      reason: `Reading secret files is not permitted (blocked path: ${blockedPath}). Only .example/.sample/.template variants may be read — never a real .env or credential file. Use the tracked .env.example template instead.`,
    };
  }

  // 2) Write secret-scan — block content that introduces a credential.
  if (WRITE_TOOLS.has(toolName)) {
    const filePath =
      toolInput &&
      typeof toolInput === 'object' &&
      typeof toolInput.file_path === 'string'
        ? toolInput.file_path
        : '';
    const findings = scanForSecrets({
      filePath,
      text: extractWriteContent({ toolInput, toolName }),
    });
    if (findings.length > 0) {
      const summary = findings
        .map((finding) => `${finding.description} (line ${finding.line})`)
        .join('; ');
      return {
        decision: 'deny',
        reason: `Write blocked — content appears to contain ${findings.length} secret(s): ${summary}. Move the credential to an env var / gitignored .env, or if this is a false positive add a "gitleaks:allow" marker on that line.`,
      };
    }
  }

  return { decision: 'allow' };
};
