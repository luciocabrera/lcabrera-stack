// Scanner-agnostic machinery shared by every deterministic runner script
// (generate-eslint-report.mjs, generate-oxlint-report.mjs,
// generate-fallow-report.mjs — ADR-019). Promoted here from
// linter-checker/scripts/lint-report-shared.mjs when fallow became the
// second consumer skill; code-smell-shared is already the cross-skill home
// for the report contract these scripts implement. Lint-specific helpers
// (config names, deriveTag, buildReport, renderReportMarkdown) stay in
// lint-report-shared.mjs, which re-exports everything below so its two
// entry scripts keep a single import site.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
export const repoRoot = resolve(scriptDirectory, '..', '..', '..', '..');

// Legacy positional usage (`node script.mjs apps/react-router`, relative to
// this CQMS repo) stays unchanged; `--target=<abs>` is how the
// scan-orchestrator points a script at an arbitrary registered project
// (which may not have vp/this repo's tooling at all — ADR-015).
export const parseRunContext = (defaultLegacyScope = 'apps/react-router') => {
  const rawArgs = process.argv.slice(2);
  const flags = {};
  const positional = [];
  for (const arg of rawArgs) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) {
      flags[match[1]] = match[2];
    } else if (arg === '--skip-ingest') {
      flags['skip-ingest'] = true;
    } else {
      positional.push(arg);
    }
  }

  const isTargetMode = Boolean(flags.target);
  const scopeArgument =
    flags.scope ?? positional[0] ?? (isTargetMode ? '.' : defaultLegacyScope);
  const scopeDirectory = isTargetMode
    ? resolve(flags.target, scopeArgument)
    : resolve(repoRoot, scopeArgument);

  const gitRoot =
    runGit(['rev-parse', '--show-toplevel'], scopeDirectory) ?? scopeDirectory;

  return { flags, gitRoot, isTargetMode, scopeArgument, scopeDirectory };
};

export const runCapturingStdout = (command, args, cwd) => {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    // Lint tools exit non-zero when diagnostics exist — the JSON is still
    // on stdout, so this is not a script failure.
    if (typeof error.stdout === 'string' && error.stdout.length > 0) {
      return error.stdout;
    }
    throw error;
  }
};

const runGit = (args, cwd) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
};

export const makeGitRootRelative = (context) => (candidatePath) => {
  const absolute = candidatePath.startsWith('/')
    ? candidatePath
    : join(context.scopeDirectory, candidatePath);
  return relative(context.gitRoot, absolute);
};

export const findConfigFile = (dir, candidateNames) =>
  candidateNames.find((name) => existsSync(join(dir, name)));

// Includes the message text, not just (rule_id, location_path,
// location_hint) — some rules (e.g. eslint's perfectionist/sort-imports)
// report multiple distinct messages at the exact same line:column, which
// would otherwise collide on scan_findings' (scan_id, finding_id) unique
// constraint. Caught by running against a real target, not by inspection.
export const makeFindingId = (ruleId, locationPath, locationHint, message) =>
  createHash('sha1')
    .update(`${ruleId}:${locationPath}:${locationHint}:${message}`)
    .digest('hex')
    .slice(0, 12);

export const makeTimestamp = () =>
  new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '--')
    .replace('Z', '');

// CQMS scratch files always live under this repo's own .tmp, never inside
// an arbitrary scanned project's working tree — unless the caller (the
// scan-orchestrator) explicitly overrides it.
export const resolveOutputDirectory = (context, skillTmpName, timestamp) => {
  const outputDirectory = context.flags['output-dir']
    ? resolve(context.flags['output-dir'])
    : join(repoRoot, '.tmp', skillTmpName, timestamp);
  mkdirSync(outputDirectory, { recursive: true });
  return outputDirectory;
};

export const writeArtifacts = ({
  markdown,
  outputDirectory,
  rawArtifact,
  rawFileName,
  report,
}) => {
  writeFileSync(
    join(outputDirectory, rawFileName),
    JSON.stringify(rawArtifact, null, 2),
    'utf8',
  );
  writeFileSync(
    join(outputDirectory, 'report.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  writeFileSync(join(outputDirectory, 'report.md'), markdown, 'utf8');
};

// Best-effort CQMS ingestion, matching the other skills. Skipped when the
// caller (the scan-orchestrator) already has its own run/scan row and will
// call ingestReport() itself.
export const ingestIntoCqms = ({
  context,
  outputDirectory,
  rawFileName,
  scannerId,
}) => {
  if (context.flags['skip-ingest']) return;

  try {
    execFileSync(
      'node',
      [
        '--env-file-if-exists=docker/local/.env',
        '--env-file-if-exists=packages/scan-ingestion/.env',
        '--experimental-strip-types',
        'packages/scan-ingestion/src/cli/ingest.cli.ts',
        `--skill=${scannerId}`,
        `--run-dir=${outputDirectory}`,
        `--local-path=${context.gitRoot}`,
        '--scope-type=folder',
        `--scope-value=${context.scopeArgument}`,
        `--raw-json=${rawFileName}`,
      ],
      { cwd: repoRoot, encoding: 'utf8', stdio: 'inherit' },
    );
  } catch (error) {
    console.warn(
      `⚠️  CQMS ingestion failed (report files are saved regardless): ${error.message}`,
    );
  }
};
