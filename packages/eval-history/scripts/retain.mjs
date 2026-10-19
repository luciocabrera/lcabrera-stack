/**
 * Applies the eval-history retention rule, so transcript pointers and content
 * snapshots do not outlive what they point at: clears the transcript of every
 * trial past its 90-day expiry unless its run is on main or part of a
 * baseline, and clears each subject's content snapshots beyond the newest 20.
 * The scheduled eval workflow runs it after ingest.
 *
 * Usage: vp run evals:retain
 * Exit codes: 0 applied; 1 on an invalid env or a failed statement.
 */
import process from 'node:process';

import { retainEvals } from '../src/retain/retainEvals.service.ts';
import { retainSummary } from '../src/retain/retainSummary.util.ts';
import { databaseUrl, errorText, withEvalsClient } from './lib/evals-cli.mjs';

try {
  const counts = await withEvalsClient(databaseUrl(), (client) =>
    retainEvals({ client, now: new Date() }),
  );
  console.log(retainSummary(counts));
} catch (error) {
  console.error(`evals:retain: ${errorText(error)}`);
  process.exitCode = 1;
}
