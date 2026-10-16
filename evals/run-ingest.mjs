/**
 * Sends a run's envelope to the eval-history database once the runner has
 * written it. The envelope on disk comes first, so nothing here can fail the
 * run: an unset EVALS_DATABASE_URL or a database that is down only warns, and
 * `vp run evals:ingest` sends the file later (FR-1.5).
 * Usage: imported by `run-record.mjs` and `ingest-envelopes.mjs`.
 */
import { ingestPaths } from '@repo/eval-history/ingest/ingestPaths.service';

export const printSummary = ({ log = console, summary }) => {
  for (const line of summary.stdout) {
    log.log(line);
  }
  for (const line of summary.stderr) {
    log.error(line);
  }
};

export const ingestAfterRun = async ({
  env = process.env,
  file,
  ingest = ingestPaths,
  log = console,
}) => {
  try {
    printSummary({
      log,
      summary: await ingest({
        connectionString: env.EVALS_DATABASE_URL,
        paths: [file],
        quietUnreachable: true,
      }),
    });
  } catch (error) {
    log.error(
      `evals:ingest: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
