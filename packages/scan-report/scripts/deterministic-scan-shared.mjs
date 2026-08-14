// Scanner-agnostic machinery shared by every deterministic runner script
// (generate-eslint-report.mjs, generate-oxlint-report.mjs,
// generate-fallow-report.mjs — CQMS ADR-019). Lint-specific helpers (config
// names, deriveTag, buildReport, renderReportMarkdown) stay in
// lint-report-shared.mjs, which re-exports everything below so its two entry
// scripts keep a single import site.
//
// Nothing here names a repository, a workspace or a database: the host root is
// derived from the install location (resolve-host-root.mjs) and persistence is
// a configured command (ingest-configuration.mjs), so the same code runs in the
// repository it ships from and in one that installed it.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveHostRoot } from './resolve-host-root.mjs';
import { runGit } from './run-git.mjs';
import { runIngestion } from './run-ingestion.mjs';

const moduleDirectory = fileURLToPath(new URL('.', import.meta.url));

/** The repository this tooling is installed in — never the scanned project. */
export const hostRoot = resolveHostRoot({ moduleDirectory });

// Positional usage (`node script.mjs packages/utils`) is resolved against the
// host root; `--target=<abs>` points a script at an arbitrary project, which
// may have none of the host's tooling (CQMS ADR-015). The default scope is the
// whole repository in both modes — naming one workspace here would bake this
// repository's data into a shared runner.
export const parseRunContext = () => {
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
  const scopeArgument = flags.scope ?? positional[0] ?? '.';
  const scopeDirectory = isTargetMode
    ? resolve(flags.target, scopeArgument)
    : resolve(hostRoot, scopeArgument);

  const gitRoot =
    runGit({ args: ['rev-parse', '--show-toplevel'], cwd: scopeDirectory }) ??
    scopeDirectory;

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

// Scratch files always live under the HOST's own .tmp, never inside an
// arbitrary scanned project's working tree — unless the caller (an
// orchestrator) explicitly overrides it.
export const resolveOutputDirectory = (context, skillTmpName, timestamp) => {
  const outputDirectory = context.flags['output-dir']
    ? resolve(context.flags['output-dir'])
    : join(hostRoot, '.tmp', skillTmpName, timestamp);
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

/**
 * Hands the finished run to the configured ingestion command. The argument
 * shape is the scan contract an ingestion CLI receives, unchanged from when
 * that command was hardcoded.
 */
export const ingestScanArtifacts = ({
  context,
  outputDirectory,
  rawFileName,
  scannerId,
}) =>
  runIngestion({
    artifactsMessage: `The report artifacts in ${outputDirectory}/ are written and complete.`,
    hostRoot,
    scanArguments: [
      `--skill=${scannerId}`,
      `--run-dir=${outputDirectory}`,
      `--local-path=${context.gitRoot}`,
      '--scope-type=folder',
      `--scope-value=${context.scopeArgument}`,
      `--raw-json=${rawFileName}`,
    ],
    skipReason: context.flags['skip-ingest']
      ? '--skip-ingest was passed'
      : undefined,
  });
