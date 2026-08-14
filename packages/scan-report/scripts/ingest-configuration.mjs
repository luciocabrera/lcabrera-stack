// Persisting a scan is the CONSUMER's choice, so the command that does it is
// configuration rather than code. This module resolves that configuration and
// nothing else; the runners keep writing their three artifacts whether or not
// it finds any.
//
// Two sources, environment first so a single run can override a checked-in
// default: the `SCAN_REPORT_INGEST_*` variables, then an `ingest` block in
// `scan-report.config.json` at the host root. Absence is a normal state — the
// caller reports a skip, not a failure.
//
// `envFiles` is loaded here and merged into the child's environment rather than
// passed through as `node --env-file` flags, so the configured command does not
// have to be node. The precedence matches node's own flag, verified against it:
// a variable already in the environment wins over the file.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';

export const CONFIG_FILE_NAME = 'scan-report.config.json';

export const INGEST_ENV = {
  args: 'SCAN_REPORT_INGEST_ARGS',
  command: 'SCAN_REPORT_INGEST_COMMAND',
  configFile: 'SCAN_REPORT_CONFIG',
  cwd: 'SCAN_REPORT_INGEST_CWD',
  envFiles: 'SCAN_REPORT_INGEST_ENV_FILES',
};

/** Names the missing configuration, so a skip is actionable rather than mysterious. */
export const MISSING_INGEST_MESSAGE = `no ingestion command is configured — set ${INGEST_ENV.command}, or add an "ingest.command" entry to ${CONFIG_FILE_NAME} at the host repository root`;

const toStringList = (value) => {
  if (Array.isArray(value))
    return value.filter((item) => typeof item === 'string');
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

/** A JSON array is accepted for arguments that legitimately contain a comma. */
const parseArgumentList = (value) => {
  if (typeof value !== 'string') return toStringList(value);
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return toStringList(trimmed);
  try {
    return toStringList(JSON.parse(trimmed));
  } catch {
    return toStringList(trimmed);
  }
};

export const configFilePathFor = ({ env, hostRoot }) => {
  const override = env[INGEST_ENV.configFile];
  return override
    ? resolve(hostRoot, override)
    : join(hostRoot, CONFIG_FILE_NAME);
};

/** The `ingest` block of the host's config file, or undefined when there is none. */
export const readIngestConfigFile = ({ env, hostRoot }) => {
  const filePath = configFilePathFor({ env, hostRoot });
  if (!existsSync(filePath)) return undefined;
  const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  const ingest = parsed?.ingest;
  return typeof ingest?.command === 'string' && ingest.command.length > 0
    ? ingest
    : undefined;
};

const fromEnvironment = (env) =>
  typeof env[INGEST_ENV.command] === 'string' &&
  env[INGEST_ENV.command].length > 0
    ? {
        args: parseArgumentList(env[INGEST_ENV.args]),
        command: env[INGEST_ENV.command],
        cwd: env[INGEST_ENV.cwd],
        envFiles: toStringList(env[INGEST_ENV.envFiles]),
      }
    : undefined;

const normalize = (ingest) => ({
  args: parseArgumentList(ingest.args),
  command: ingest.command,
  cwd: typeof ingest.cwd === 'string' ? ingest.cwd : '.',
  envFiles: toStringList(ingest.envFiles),
});

/**
 * The resolved ingestion command, or undefined when the host configured none.
 * Throws only when a config file exists but cannot be read — a malformed
 * configuration is a mistake to surface, not an absence to skip over.
 */
export const resolveIngestConfig = ({ env = process.env, hostRoot }) => {
  const configured =
    fromEnvironment(env) ?? readIngestConfigFile({ env, hostRoot });
  return configured ? normalize(configured) : undefined;
};

/**
 * Variables from the configured env files; an absent file contributes nothing.
 * Later files win, so the order in the configuration is the precedence order.
 *
 * The accumulator is assigned into rather than respread each round — it is
 * allocated here and escapes nowhere, which is the case AGENTS.md §5 rule 6
 * carves out, and respreading it is quadratic (Biome `noAccumulatingSpread`).
 */
export const readEnvFiles = ({ envFiles, hostRoot }) =>
  envFiles.reduce((accumulated, file) => {
    const filePath = isAbsolute(file) ? file : resolve(hostRoot, file);
    if (!existsSync(filePath)) return accumulated;
    return Object.assign(accumulated, parseEnv(readFileSync(filePath, 'utf8')));
  }, {});

/** Runs the configured command with the scan arguments appended. Throws on failure. */
export const runConfiguredIngest = ({ config, hostRoot, scanArguments }) => {
  execFileSync(config.command, [...config.args, ...scanArguments], {
    cwd: resolve(hostRoot, config.cwd),
    encoding: 'utf8',
    env: {
      ...readEnvFiles({ envFiles: config.envFiles, hostRoot }),
      ...process.env,
    },
    stdio: 'inherit',
  });
};
