/**
 * Records the true answer to a false-positive panel case, so the panel's
 * verdicts can be scored against it, then prints how often each model was
 * right in each role. `--accuracy` prints that without recording.
 *
 * Usage: vp run evals:grade-adjudication -- <case_id> <REAL|FALSE_POSITIVE> [--source lucio|upstream-fix|reopened] [--note <text>]
 *        vp run evals:grade-adjudication -- --accuracy
 * Exit codes: 0 recorded or printed; 1 on an invalid env or argument, a case
 * not stored, a reopened case that was not dismissed, or a failed statement.
 */
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { adjudicationAccuracyLines } from '../src/adjudications/adjudicationAccuracyLines.util.ts';
import { groundTruthRequest } from '../src/adjudications/groundTruthRequest.util.ts';
import { readAdjudicationAccuracy } from '../src/adjudications/readAdjudicationAccuracy.service.ts';
import { recordGroundTruth } from '../src/adjudications/recordGroundTruth.service.ts';
import { loadRegressionConfig } from '../src/stats/loadRegressionConfig.service.ts';
import { runGradeCommand } from './lib/evals-cli.mjs';

const REGRESSION_CONFIG = fileURLToPath(
  new URL('../../../evals/regression.config.json', import.meta.url),
);

const requestFrom = (args) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args,
    options: {
      accuracy: { type: 'boolean' },
      note: { type: 'string' },
      source: { type: 'string' },
    },
  });
  const request = groundTruthRequest({
    accuracy: values.accuracy === true,
    note: values.note,
    positionals,
    source: values.source,
  });
  if (request.kind === 'invalid') {
    throw new Error(request.problems.join('\n'));
  }
  return request;
};

const accuracyLines = async (client) => {
  const { minTrialsForRate, z } = await loadRegressionConfig({
    file: REGRESSION_CONFIG,
  });
  return adjudicationAccuracyLines({
    minN: minTrialsForRate,
    rows: await readAdjudicationAccuracy({ client }),
    z,
  });
};

const record = async (client, request) => {
  if (request.kind !== 'grade') {
    return;
  }
  const { caseId, note, source, truth } = request;
  const result = await recordGroundTruth({
    caseId,
    client,
    note,
    source,
    truth,
  });
  if (result.kind === 'rejected') {
    throw new Error(result.problems.join('\n'));
  }
  console.log(
    `evals:grade-adjudication: recorded ${truth} (${source}) for ${result.outcome} case ${caseId}`,
  );
};

await runGradeCommand({
  name: 'evals:grade-adjudication',
  report: accuracyLines,
  requestFrom,
  run: record,
});
