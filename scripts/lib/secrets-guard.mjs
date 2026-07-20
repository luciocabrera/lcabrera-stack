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
 * The file-path taxonomy and per-tool path extraction are a faithful port of
 * ADR-020 (packages/agent-runner/src/isSecretFilePath.util.ts and
 * collectToolInputPaths.util.ts) so the two guards agree on what "secret" means;
 * the `--selftest` cases in the entry mirror that package's tests to keep parity.
 * The write-content scanner is new (ADR-020 does not scan writes).
 *
 * Governed by .claude/rules/scripts.md.
 */
import { basename } from 'node:path';

// ---- file-path taxonomy (ADR-020: isSecretFilePath.util.ts) -----------------

// `.env.<suffix>` variants that are documentation/templates by convention,
// never real credentials — the only carve-outs from the .env family.
const SAFE_ENV_SUFFIXES = new Set(['.example', '.sample', '.template']);
const SECRET_BASENAMES = new Set([
  '.dockercfg',
  '.envrc',
  '.git-credentials',
  '.netrc',
  '.npmrc',
  '.pgpass',
  'credentials',
  'credentials.json',
]);
const SECRET_EXTENSIONS = new Set(['.key', '.p12', '.pem', '.pfx']);
const SECRET_KEY_PREFIXES = ['id_dsa', 'id_ecdsa', 'id_ed25519', 'id_rsa'];

/** Name-based: does this path point at a credential-bearing file? */
const isSecretFilePath = (candidatePath) => {
  const name = basename(String(candidatePath).trim()).toLowerCase();
  if (name.length === 0) {
    return false;
  }
  if (name.startsWith('.env.')) {
    return !SAFE_ENV_SUFFIXES.has(name.slice('.env'.length));
  }
  if (name === '.env' || name.endsWith('.env')) {
    return true;
  }
  if (SECRET_BASENAMES.has(name)) {
    return true;
  }
  if (SECRET_KEY_PREFIXES.some((prefix) => name.startsWith(prefix))) {
    return true;
  }
  const dotIndex = name.lastIndexOf('.');
  const extension = dotIndex === -1 ? '' : name.slice(dotIndex);
  return SECRET_EXTENSIONS.has(extension);
};

// ---- per-tool path extraction (ADR-020: collectToolInputPaths.util.ts) ------

// Grep's `pattern` is deliberately absent — it is a CONTENT regex (grepping
// source for the string ".env" is legitimate); its glob/path fields are paths.
const PATH_FIELDS_BY_TOOL = {
  Glob: ['path', 'pattern'],
  Grep: ['glob', 'path'],
  Read: ['file_path'],
};
const GLOB_WILDCARDS = /[*?[\]]/g;
const BASH_SEPARATORS = /[\s"'`;|&<>()]+/;

const collectToolInputPaths = ({ toolInput, toolName }) => {
  if (!toolInput || typeof toolInput !== 'object') {
    return [];
  }
  if (toolName === 'Bash') {
    const command =
      typeof toolInput.command === 'string' ? toolInput.command : '';
    return command
      .split(BASH_SEPARATORS)
      .flatMap((token) => token.split('='))
      .filter((fragment) => fragment.length > 0);
  }
  const pathFields = PATH_FIELDS_BY_TOOL[toolName] ?? [];
  return pathFields.flatMap((field) => {
    const value = toolInput[field];
    return typeof value === 'string'
      ? [value.replaceAll(GLOB_WILDCARDS, '')]
      : [];
  });
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
    re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/,
  },
  {
    id: 'openai-key',
    description: 'OpenAI-style secret key',
    re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
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
    re: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    id: 'google-oauth-token',
    description: 'Google OAuth token',
    re: /\bya29\.[0-9A-Za-z_-]{20,}/,
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
    re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{10,}\b/,
  },
];

// Generic assignments — only trusted when the VALUE is itself high-entropy and
// not a placeholder, and only outside the exempt paths below (the repo's whole
// false-positive surface is test fixtures + the guard's own constant tables).
const GENERIC_PATTERNS = [
  {
    id: 'hardcoded-secret-assignment',
    description: 'hardcoded secret assignment',
    re: /(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key|auth[_-]?token)["']?\s*[:=]\s*["']([^"'\s]{16,})["']/i,
  },
  {
    id: 'high-entropy-env-value',
    description: 'high-entropy env assignment',
    re: /^\s*[A-Z][A-Z0-9_]{2,}\s*=\s*([A-Za-z0-9+/=._-]{20,})\s*$/,
  },
];

const ALLOW_MARKER =
  /gitleaks:allow|pragma:\s*allowlist secret|secrets-guard:\s*allow/i;
const PLACEHOLDER =
  /^(?:your|my|the|an?|example|sample|test|dummy|fake|changeme|change_me|placeholder|redacted|secret|token|password|value|todo|none|null|undefined|xxx+|abc|foo|bar|baz)\b/i;
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

const isPlaceholderValue = (value) =>
  value.length === 0 ||
  PLACEHOLDER.test(value) ||
  FORMAT_HINT.test(value) ||
  FILLER_ONLY.test(value);

const looksLikeRealSecret = (value) =>
  value.length >= 16 &&
  !isPlaceholderValue(value) &&
  shannonEntropy(value) >= 4;

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

const matchLine = ({ line, lineNumber, allowGeneric }) => {
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
  if (!allowGeneric) {
    return providerHits;
  }
  const genericHits = GENERIC_PATTERNS.flatMap((rule) => {
    const captured = rule.re.exec(line)?.[1];
    return captured !== undefined && looksLikeRealSecret(captured)
      ? [{ description: rule.description, line: lineNumber, ruleId: rule.id }]
      : [];
  });
  return [...providerHits, ...genericHits];
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
  const blockedPath = collectToolInputPaths({ toolInput, toolName }).find(
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
