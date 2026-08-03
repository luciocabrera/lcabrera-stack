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
 * the shared spec by its own tests (here: `secrets-guard.test.mjs`, mirroring
 * secretFileGuardHook.util.test.ts). Keep the taxonomy VALUES in sync.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { basename } from 'node:path';

import { fileExtension, scanForSecrets } from './secrets-guard-content.mjs';

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

// A quoted span is ONE candidate, never shredded into its words. Splitting it
// made every word of a commit message, PR title or `node -e` script a candidate
// path, so `git commit -m "...credentials..."` was denied as a secret-file read.
// A quoted path is still checked — the span as a whole is what gets tested, so
// `cat "my file.env"` still matches. Linear, no nested quantifier (S8786).
//
// Known gap: prose OUTSIDE quotes — a heredoc body naming `.npmrc`, say — is
// still tokenised word-by-word and still denied. Closing that needs real shell
// parsing to tell a heredoc body from arguments, which is not worth it: write
// the text to a file and pass it by path (`--body-file`), as the callers that
// hit this already do.
const QUOTED_SPAN = /"([^"]*)"|'([^']*)'|`([^`]*)`/g;

const bashCandidates = (command) => {
  const quoted = [];
  const unquoted = command.replace(
    QUOTED_SPAN,
    (_match, doubleQuoted, singleQuoted, backQuoted) => {
      quoted.push(doubleQuoted ?? singleQuoted ?? backQuoted ?? '');
      return ' ';
    },
  );
  return [...quoted, ...unquoted.split(BASH_TOKEN_SPLIT)].filter(
    (token) => token.length > 0,
  );
};

const candidatePathsFor = ({ toolInput, toolName }) => {
  if (!toolInput || typeof toolInput !== 'object') {
    return [];
  }
  if (toolName === 'Bash') {
    return bashCandidates(
      typeof toolInput.command === 'string' ? toolInput.command : '',
    );
  }
  return (TOOL_PATH_FIELDS[toolName] ?? [])
    .map((field) => toolInput[field])
    .filter((value) => typeof value === 'string')
    .map((value) => value.replace(GLOB_WILDCARDS, ''));
};

// Taxonomy entries that are also ordinary English words. Matching one on a bare
// token denies any command that merely MENTIONS it — a commit message, an issue
// body, a grep pattern. Every other entry is dot-prefixed (`.npmrc`, `.netrc`)
// or carries an extension (`credentials.json`, `*.pem`), so it cannot be
// mistaken for prose; this list is derived rather than hand-written so a future
// bare-word entry is covered automatically.
const AMBIGUOUS_BASENAMES = new Set(
  SECRET_FILE.credentialBasenames.filter(
    (name) => !name.startsWith('.') && !name.includes('.'),
  ),
);

const hasDirectoryComponent = (candidate) => /[/\\]/.test(String(candidate));

/**
 * Bash tokens are GUESSES at paths; Read's `file_path` is a declared one. So an
 * ambiguous bare word only counts here when it carries a directory — which the
 * real files always do (`~/.aws/credentials`, `./credentials`). The deliberate
 * cost is a bare `cat credentials` naming a file in the working directory; the
 * explicit path tools still match that spelling, and it is a poor trade to deny
 * every sentence containing the word to catch it.
 */
const isSecretPathInCommand = (candidate) => {
  const name = basename(String(candidate).trim()).toLowerCase();
  if (AMBIGUOUS_BASENAMES.has(name) && !hasDirectoryComponent(candidate)) {
    return false;
  }
  return isSecretFilePath(candidate);
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
  // Bash gets the stricter reading of what counts as a path, because its
  // candidates are inferred from a command line rather than declared in a field.
  const isSecretCandidate =
    toolName === 'Bash' ? isSecretPathInCommand : isSecretFilePath;
  const blockedPath = candidatePathsFor({ toolInput, toolName }).find(
    (candidate) => isSecretCandidate(candidate),
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
