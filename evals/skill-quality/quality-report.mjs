/**
 * Turns one skill-quality run, read from its run envelope, into the data the
 * HTML report shows, and pours it into report-template.html. Each run is also kept as a small record, so the
 * report can show how every skill moved since the last run that judged it.
 * Usage: imported by verify-skill-quality.mjs.
 */
import { RUBRIC } from './skill-quality.mjs';

export const REPORT_PLACEHOLDER = '__REPORT_DATA__';

const judgedOnly = (results) =>
  results.filter(({ judgement }) => judgement !== undefined);

export const runRecord = ({ generatedAt, model, results }) => ({
  generatedAt,
  model,
  scores: Object.fromEntries(
    judgedOnly(results).map(({ judgement, skill }) => [
      skill,
      judgement.overall,
    ]),
  ),
});

const isRun = (run) => typeof run?.scores === 'object' && run.scores !== null;

export const parseRun = (text) => {
  try {
    const run = JSON.parse(text);
    return isRun(run) ? run : undefined;
  } catch {
    return;
  }
};

export const previousOverall = ({ history, skill }) =>
  history.findLast((run) => typeof run.scores[skill] === 'number')?.scores[
    skill
  ];

const skillEntry = ({ history, result }) =>
  result.judgement === undefined
    ? { error: result.error, skill: result.skill }
    : {
        dimensions: result.judgement.dimensions,
        overall: result.judgement.overall,
        previous: previousOverall({ history, skill: result.skill }),
        skill: result.skill,
        summary: result.judgement.summary,
      };

export const reportData = ({ generatedAt, history, model, results }) => ({
  generatedAt,
  model,
  rubric: RUBRIC,
  skills: results.map((result) => skillEntry({ history, result })),
});

const taskOrder = (tasks) =>
  new Map(
    tasks.map(({ subject, task_key }, index) => [
      task_key,
      { index, skill: subject.name },
    ]),
  );

const resultOf = ({ detail, error_class, outcome, skill }) =>
  outcome === 'pass'
    ? {
        judgement: {
          dimensions: detail.dimensions,
          overall: detail.overall,
          summary: detail.summary,
        },
        skill,
      }
    : { error: detail.problem ?? error_class ?? outcome, skill };

export const envelopeResults = ({ tasks, trials }) => {
  const order = taskOrder(tasks);
  return trials
    .map((trial) => ({ ...trial, ...order.get(trial.task_key) }))
    .toSorted((left, right) => left.index - right.index)
    .map(resultOf);
};

export const reportDataFromEnvelope = ({ envelope, history }) =>
  reportData({
    generatedAt: envelope.run.finished_at,
    history,
    model: envelope.run.model_id,
    results: envelopeResults(envelope),
  });

export const renderReport = ({ data, template }) => {
  if (!template.includes(REPORT_PLACEHOLDER)) {
    throw new Error(
      `the report template has no ${REPORT_PLACEHOLDER} placeholder`,
    );
  }
  const json = JSON.stringify(data).replaceAll('<', String.raw`\u003c`);
  return template.replace(REPORT_PLACEHOLDER, () => json);
};
