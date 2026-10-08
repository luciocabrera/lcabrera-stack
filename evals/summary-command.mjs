/**
 * The shell every eval command that returns a summary shares: print its
 * stdout and stderr lines, exit with its code, and turn anything thrown into
 * one line naming the command and exit 1.
 * Usage: imported by `ingest-envelopes.mjs` and `report-runs.mjs`.
 */
import { printSummary } from './run-ingest.mjs';

const messageOf = (error) =>
  error instanceof Error ? error.message : String(error);

export const runSummaryCommand = async ({
  log = console,
  name,
  process: target = process,
  summarize,
}) => {
  try {
    const summary = await summarize();
    printSummary({ log, summary });
    target.exitCode = summary.exitCode;
  } catch (error) {
    log.error(`${name}: ${messageOf(error)}`);
    target.exitCode = 1;
  }
};
