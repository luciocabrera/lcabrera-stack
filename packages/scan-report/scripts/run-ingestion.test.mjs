// The three outcomes are the behavioural distinction this package exists to
// create: an unconfigured ingest is a normal state, a configured one that fails
// is not, and they must not look alike. Each assertion below pins one of the
// three things that can silently collapse them — the outcome, the message a
// reader acts on, and the exit code CI reads.

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test';

import { CONFIG_FILE_NAME, INGEST_ENV } from './ingest-configuration.mjs';
import { INGESTION_OUTCOMES, runIngestion } from './run-ingestion.mjs';

const ARTIFACTS_MESSAGE = 'The report artifacts are written and complete.';

const makeHostRoot = (contents) => {
  const hostRoot = mkdtempSync(join(tmpdir(), 'scan-report-ingest-'));
  if (contents !== undefined) {
    writeFileSync(join(hostRoot, CONFIG_FILE_NAME), contents, 'utf8');
  }
  return hostRoot;
};

/** Every env var the resolver reads, cleared so the host's own does not leak in. */
const clearIngestEnv = () => {
  for (const name of Object.values(INGEST_ENV)) delete process.env[name];
};

let logs = [];
let errors = [];
let exitCodeBefore;
let envBefore;

beforeEach(() => {
  logs = [];
  errors = [];
  exitCodeBefore = process.exitCode;
  envBefore = Object.fromEntries(
    Object.values(INGEST_ENV).map((name) => [name, process.env[name]]),
  );
  clearIngestEnv();
  vi.spyOn(console, 'log').mockImplementation((line) => logs.push(line));
  vi.spyOn(console, 'error').mockImplementation((line) => errors.push(line));
});

afterEach(() => {
  vi.restoreAllMocks();
  // A leaked exitCode would fail the whole run, not this test.
  process.exitCode = exitCodeBefore;
  for (const [name, value] of Object.entries(envBefore)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

const run = (overrides) =>
  runIngestion({
    artifactsMessage: ARTIFACTS_MESSAGE,
    hostRoot: makeHostRoot(),
    scanArguments: ['--skill=oxlint', '--run-dir=/tmp/run'],
    ...overrides,
  });

describe('skipped — the caller asked to skip', () => {
  test('reports the outcome, the reason, and leaves the exit code alone', () => {
    expect(run({ skipReason: '--skip-ingest was passed' })).toBe(
      INGESTION_OUTCOMES.skipped,
    );
    expect(logs.join('\n')).toContain(
      'Ingestion skipped: --skip-ingest was passed.',
    );
    expect(errors).toEqual([]);
    expect(process.exitCode).toBe(exitCodeBefore);
  });
});

describe('skipped — nothing is configured', () => {
  test('is the skipped outcome, not a failure', () => {
    expect(run({})).toBe(INGESTION_OUTCOMES.skipped);
    expect(process.exitCode).toBe(exitCodeBefore);
    expect(errors).toEqual([]);
  });

  test('names the missing configuration, so the skip is actionable', () => {
    run({});
    const output = logs.join('\n');
    expect(output).toContain(INGEST_ENV.command);
    expect(output).toContain(CONFIG_FILE_NAME);
  });

  test('says the artifacts are complete — the deliverable survived', () => {
    run({});
    expect(logs.join('\n')).toContain(ARTIFACTS_MESSAGE);
  });
});

describe('ingested — the configured command succeeded', () => {
  /** A stand-in ingestion CLI that records the arguments it was handed. */
  const configureStub = (hostRoot) => {
    const stub = join(hostRoot, 'ingest-stub.mjs');
    const received = join(hostRoot, 'received.json');
    writeFileSync(
      stub,
      `import { writeFileSync } from 'node:fs';\n` +
        `writeFileSync(${JSON.stringify(received)}, JSON.stringify(process.argv.slice(2)));\n`,
      'utf8',
    );
    process.env[INGEST_ENV.command] = process.execPath;
    process.env[INGEST_ENV.args] = JSON.stringify([stub]);
    return received;
  };

  test('reports the outcome, stays silent on stderr, leaves the exit code alone', () => {
    const hostRoot = makeHostRoot();
    configureStub(hostRoot);

    expect(run({ hostRoot })).toBe(INGESTION_OUTCOMES.ingested);
    expect(errors).toEqual([]);
    expect(process.exitCode).toBe(exitCodeBefore);
  });

  test('forwards the scan arguments verbatim, after the configured ones', () => {
    const hostRoot = makeHostRoot();
    const received = configureStub(hostRoot);
    const scanArguments = ['--skill=oxlint', '--run-dir=/tmp/run'];

    run({ hostRoot, scanArguments });

    expect(JSON.parse(readFileSync(received, 'utf8'))).toEqual(scanArguments);
  });
});

describe('failed — a configured command that did not complete', () => {
  beforeEach(() => {
    process.env[INGEST_ENV.command] = '/nonexistent/ingest-cli';
  });

  test('is a distinct outcome from a skip', () => {
    expect(run({})).toBe(INGESTION_OUTCOMES.failed);
  });

  test('exits non-zero — this is the state that must not read as normal', () => {
    run({});
    expect(process.exitCode).toBe(1);
  });

  test('says FAILED on stderr and names the command', () => {
    run({});
    const output = errors.join('\n');
    expect(output).toContain('Ingestion FAILED');
    expect(output).toContain('/nonexistent/ingest-cli');
    expect(output).toContain(ARTIFACTS_MESSAGE);
  });

  test('does not describe itself as skipped anywhere', () => {
    run({});
    expect([...logs, ...errors].join('\n')).not.toContain('Ingestion skipped');
  });
});

describe('failed — the configuration itself is broken', () => {
  test('a malformed config file fails loudly instead of throwing', () => {
    const hostRoot = makeHostRoot('{ this is not json');

    expect(() => run({ hostRoot })).not.toThrow();
    expect(process.exitCode).toBe(1);
    expect(errors.join('\n')).toContain('configuration could not be read');
  });

  test('a malformed config is a failure, never a silent skip', () => {
    const hostRoot = makeHostRoot('{ this is not json');
    expect(run({ hostRoot })).toBe(INGESTION_OUTCOMES.failed);
  });
});
