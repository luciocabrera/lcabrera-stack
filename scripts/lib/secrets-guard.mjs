/**
 * Pure decision core for the Claude Code secrets-guard PreToolUse hook.
 *
 * Why this exists: the harness must be structurally unable to (a) read a
 * secret/.env file or (b) write a file that introduces a credential — a policy
 * that AGENTS.md §6 states but nothing enforced at the tool boundary for the
 * interactive Claude Code CLI. This module is the pure brain: given a PreToolUse payload it returns
 * an allow/deny decision, with no I/O, so it is trivially unit-testable and the
 * entry script (`claude-secrets-guard.mjs`) stays a thin stdin→stdout shell.
 *
 * The secret-file policy is ADR-020's, and this is the only copy of it here,
 * so `secrets-guard.test.mjs` is the whole lock on the taxonomy.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { basename } from 'node:path';

import { fileExtension, scanForSecrets } from './secrets-guard-content.mjs';

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

const LINE_REFERENCE = /:\d+(?::\d+)?$/;

const candidateBasename = (candidate) =>
  basename(String(candidate).trim()).toLowerCase().replace(LINE_REFERENCE, '');

const isSecretFilePath = (candidate) => {
  const name = candidateBasename(candidate);
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

const TOOL_PATH_FIELDS = {
  Glob: ['path', 'pattern'],
  Grep: ['glob', 'path'],
  Read: ['file_path'],
};
const BASH_TOKEN_SPLIT = /[\s"'`;|&<>()=]+/;
const GLOB_WILDCARDS = /[*?[\]]/g;

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

const AMBIGUOUS_BASENAMES = new Set(
  SECRET_FILE.credentialBasenames.filter(
    (name) => !name.startsWith('.') && !name.includes('.'),
  ),
);

const hasDirectoryComponent = (candidate) => /[/\\]/.test(String(candidate));

const ENV_CODE_CHAIN =
  /^(?:(?:globalThis\.)?process|import\.meta|bun|deno)\.env$/i;

const isSecretPathInCommand = (candidate) => {
  const name = candidateBasename(candidate);
  if (AMBIGUOUS_BASENAMES.has(name) && !hasDirectoryComponent(candidate)) {
    return false;
  }
  if (ENV_CODE_CHAIN.test(String(candidate).trim())) {
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

export const evaluatePreToolUse = ({ hookEventName, toolInput, toolName }) => {
  if (hookEventName !== 'PreToolUse') {
    return { decision: 'allow' };
  }

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
