/**
 * Records a hand grade of a skill-quality trial beside the judge's score for
 * the same dimension, then prints how often the two agree, per judge model and
 * judge prompt hash. `--agreement` prints that rate without recording.
 *
 * Usage: vp run evals:grade -- --trial <id> --score <dimension>=<1-5> [--score ...] [--grader <name>]
 *        vp run evals:grade -- --agreement
 * Exit codes: 0 recorded or printed; 1 on an invalid env or argument, a trial
 * or dimension the judge never scored, or a failed statement.
 */
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { gradeRequest } from '../src/grades/gradeRequest.util.ts';
import { judgeAgreement } from '../src/grades/judgeAgreement.util.ts';
import { judgeAgreementLines } from '../src/grades/judgeAgreementLines.util.ts';
import { readJudgeAgreement } from '../src/grades/readJudgeAgreement.service.ts';
import { recordHumanGrades } from '../src/grades/recordHumanGrades.service.ts';
import { loadRegressionConfig } from '../src/stats/loadRegressionConfig.service.ts';
import {
  cliArguments,
  currentAuthor,
  databaseUrl,
  errorText,
  withEvalsClient,
} from './lib/evals-cli.mjs';

const REGRESSION_CONFIG = fileURLToPath(
  new URL('../../../evals/regression.config.json', import.meta.url),
);

const requestFrom = (args) => {
  const { values } = parseArgs({
    args,
    options: {
      agreement: { type: 'boolean' },
      grader: { type: 'string' },
      score: { multiple: true, type: 'string' },
      trial: { type: 'string' },
    },
  });
  const request = gradeRequest({
    agreement: values.agreement === true,
    grader: values.grader ?? currentAuthor(),
    scores: values.score ?? [],
    trial: values.trial,
  });
  if (request.kind === 'invalid') {
    throw new Error(request.problems.join('\n'));
  }
  return request;
};

const agreementLines = async (client) => {
  const { minTrialsForRate, z } = await loadRegressionConfig({
    file: REGRESSION_CONFIG,
  });
  const judges = judgeAgreement({
    minN: minTrialsForRate,
    rows: await readJudgeAgreement({ client }),
    z,
  });
  return judgeAgreementLines({ judges, minN: minTrialsForRate, z });
};

const run = async (client, request) => {
  if (request.kind === 'grade') {
    const result = await recordHumanGrades({ client, ...request });
    if (result.kind === 'rejected') {
      throw new Error(result.problems.join('\n'));
    }
    console.log(
      `evals:grade: recorded ${request.grader}'s grade of trial ${request.trialId} on ${result.dimensions.join(', ')}`,
    );
  }
  const lines = await agreementLines(client);
  console.log(lines.join('\n'));
};

try {
  const request = requestFrom(cliArguments());
  await withEvalsClient(databaseUrl(), (client) => run(client, request));
} catch (error) {
  console.error(`evals:grade: ${errorText(error)}`);
  process.exitCode = 1;
}
