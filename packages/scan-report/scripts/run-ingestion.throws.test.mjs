// `runIngestion` promises never to throw, and the one thing that can break that
// promise is the handler meant to keep it: `catch (error) { error.message }`
// reads a property off whatever was thrown, and `throw null` is legal
// JavaScript. A scanner that wrote its three artifacts has done its job, so a
// persistence problem must not surface as a stack trace from inside the catch.
//
// Mocked at the ingestion seam rather than driven through a real command,
// because `execFileSync` only ever throws an `Error` — the shapes that break
// the naive handler cannot be produced any other way.

import { mkdtempSync } from 'node:fs';
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

import { INGEST_ENV, runConfiguredIngest } from './ingest-configuration.mjs';
import { INGESTION_OUTCOMES, runIngestion } from './run-ingestion.mjs';

vi.mock('./ingest-configuration.mjs', async (importOriginal) => ({
  ...(await importOriginal()),
  runConfiguredIngest: vi.fn(),
}));

let errors = [];
let exitCodeBefore;
let commandBefore;

beforeEach(() => {
  errors = [];
  exitCodeBefore = process.exitCode;
  commandBefore = process.env[INGEST_ENV.command];
  process.env[INGEST_ENV.command] = '/nonexistent/ingest-cli';
  vi.spyOn(console, 'error').mockImplementation((line) => errors.push(line));
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = exitCodeBefore;
  if (commandBefore === undefined) delete process.env[INGEST_ENV.command];
  else process.env[INGEST_ENV.command] = commandBefore;
});

const run = () =>
  runIngestion({
    artifactsMessage: 'The report artifacts are written and complete.',
    hostRoot: mkdtempSync(join(tmpdir(), 'scan-report-throws-')),
    scanArguments: ['--skill=oxlint'],
  });

const throwing = (value) => () => {
  throw value;
};

/** An object whose own stringification fails — the last way to break a reporter. */
const unprintable = () => ({
  get message() {
    throw new Error('message getter exploded');
  },
  toString() {
    throw new Error('toString exploded');
  },
});

describe('when the ingestion command throws a plain string', () => {
  // The naive `error.message` does not throw here — it yields `undefined`, so
  // the operator reads "did not complete — undefined" and loses the reason.
  // Asserting the outcome alone would let that through.
  test('the thrown text reaches the message', () => {
    vi.mocked(runConfiguredIngest).mockImplementation(
      throwing('the CLI refused the run directory'),
    );

    expect(run()).toBe(INGESTION_OUTCOMES.failed);
    expect(errors.join('\n')).toContain('the CLI refused the run directory');
  });
});

describe.each([
  ['null', () => null],
  ['a plain string', () => 'the CLI refused'],
  ['a value that cannot be stringified', unprintable],
])('when the ingestion command throws %s', (_label, makeValue) => {
  test('runIngestion does not throw', () => {
    vi.mocked(runConfiguredIngest).mockImplementation(throwing(makeValue()));
    expect(run).not.toThrow();
  });

  test('it is still the failed outcome, reported and exiting non-zero', () => {
    vi.mocked(runConfiguredIngest).mockImplementation(throwing(makeValue()));

    expect(run()).toBe(INGESTION_OUTCOMES.failed);
    expect(errors.join('\n')).toContain('Ingestion FAILED');
    expect(process.exitCode).toBe(1);
  });
});

describe('when it throws an ordinary Error', () => {
  test('the message is used verbatim, so the common case still reads well', () => {
    vi.mocked(runConfiguredIngest).mockImplementation(
      throwing(new Error('connect ECONNREFUSED 127.0.0.1:5432')),
    );

    run();
    expect(errors.join('\n')).toContain('connect ECONNREFUSED 127.0.0.1:5432');
  });
});
