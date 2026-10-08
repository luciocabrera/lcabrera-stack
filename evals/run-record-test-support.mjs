/**
 * What a `recordRun` test needs around it: a fresh results directory removed
 * when the test finishes, an ingest spy, and a stand-in for the process's
 * signal events, so no test shares state with the one before it.
 * Usage: imported by the `*.test.mjs` files under `evals/`.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { onTestFinished, vi } from 'vite-plus/test';

import { STARTED_AT, testIdentity } from './envelope-test-support.mjs';
import { recordRun } from './run-record.mjs';

export const fakeSignals = () => {
  const listeners = new Map();
  return {
    emit: (signal) => {
      const registered = listeners.get(signal) ?? [];
      for (const listener of registered) {
        listener();
      }
    },
    listenerCount: (signal) => listeners.get(signal)?.size ?? 0,
    off: (signal, listener) => {
      listeners.get(signal)?.delete(listener);
    },
    on: (signal, listener) => {
      listeners.set(signal, (listeners.get(signal) ?? new Set()).add(listener));
    },
  };
};

export const resultsDirectory = () => {
  const resultsDir = mkdtempSync(join(tmpdir(), 'eval-results-'));
  onTestFinished(() => {
    rmSync(resultsDir, { force: true, recursive: true });
  });
  return resultsDir;
};

export const recording = ({ plan }) => {
  const resultsDir = resultsDirectory();
  const ingest = vi.fn(async () => undefined);
  return {
    ingest,
    record: (overrides) =>
      recordRun({
        clock: () => STARTED_AT + 2000,
        identity: testIdentity,
        ingest,
        plan,
        resultsDir,
        signals: fakeSignals(),
        ...overrides,
      }),
    resultsDir,
    written: () =>
      JSON.parse(
        readFileSync(
          join(resultsDir, plan.suite, `${testIdentity.run_id}.json`),
          'utf8',
        ),
      ),
  };
};
