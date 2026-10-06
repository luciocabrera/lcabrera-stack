/**
 * The rules-consistency run as envelope records: each path rule a subject,
 * each of its three checks a task, and each check's findings one trial. The
 * suite calls no model, so every trial costs nothing and carries no tokens.
 * Usage: imported by `verify-rules-consistency.mjs`.
 */
import { canonicalHash } from '@repo/eval-history/hashing/canonicalHash.util';
import { contentHash } from '@repo/eval-history/hashing/contentHash.util';

import { isoAt, taskRecord, tokensOf } from '../run-envelope.mjs';

const SUITE = 'rules-consistency';
const RULE_SUFFIX = '.md';

const nameOf = (label) =>
  label.slice(label.lastIndexOf('/') + 1, -RULE_SUFFIX.length);

const taskKeyOf = ({ check, label }) => `${SUITE}/${nameOf(label)}/${check}`;

const namesRule = (finding, label) => finding.split(/[\s,]+/u).includes(label);

const ownFindings = ({ findings, label }) =>
  findings.filter((finding) => namesRule(finding, label));

const overlapFindings = ({ label, shared }) =>
  shared
    .filter(({ first, second }) => first === label || second === label)
    .map(
      ({ first, second, shared: files }) =>
        `loads with ${first === label ? second : first} on ${files.length} file(s)`,
    );

const checksOf = ({
  coverageFindings,
  indexFindings,
  label,
  onDisk,
  shared,
}) => [
  {
    check: 'indexed',
    findings: ownFindings({ findings: indexFindings, label }),
  },
  ...(onDisk
    ? [
        {
          check: 'covered',
          findings: ownFindings({ findings: coverageFindings, label }),
        },
        { check: 'overlap', findings: overlapFindings({ label, shared }) },
      ]
    : []),
];

const subjectOf = ({ label, source }) => ({
  content_hash: contentHash(source),
  kind: 'rule',
  name: nameOf(label),
  path: label,
});

const taskOf = ({ check, label }) =>
  taskRecord({
    kind: 'rule-check',
    subject: { kind: 'rule', name: nameOf(label) },
    task_hash: canonicalHash({ check, path: label }),
    task_key: taskKeyOf({ check, label }),
  });

const outcomeOf = ({ check, findings }) =>
  check === 'overlap' || findings.length === 0 ? 'pass' : 'fail';

const trialOf = ({ check, findings, finishedAt, label, startedAt }) => ({
  cost_usd_reported: 0,
  detail: { check, findings, schema: 'rules/1' },
  duration_api_ms: null,
  duration_ms: finishedAt - startedAt,
  error_class: null,
  finished_at: isoAt(finishedAt),
  first_token_at: null,
  model_usage: {},
  outcome: outcomeOf({ check, findings }),
  queued_at: isoAt(startedAt),
  started_at: isoAt(startedAt),
  task_key: taskKeyOf({ check, label }),
  tokens: tokensOf(),
  transcript: null,
  trial_index: 0,
  turns: null,
});

const dangling = ({ indexed, rules }) => {
  const onDisk = new Set(rules.map(({ label }) => label));
  return indexed
    .filter((label) => !onDisk.has(label))
    .map((label) => ({ label, onDisk: false, source: '' }));
};

export const rulesRecords = ({
  coverageFindings,
  finishedAt,
  indexed,
  indexFindings,
  rules,
  shared,
  startedAt,
}) => {
  const subjects = [
    ...rules.map((rule) => ({ ...rule, onDisk: true })),
    ...dangling({ indexed, rules }),
  ];
  const checks = subjects.flatMap(({ label, onDisk }) =>
    checksOf({ coverageFindings, indexFindings, label, onDisk, shared }).map(
      (check) => ({ ...check, label }),
    ),
  );
  return {
    subjects: subjects.map(subjectOf),
    tasks: checks.map(taskOf),
    trials: checks.map((check) => trialOf({ ...check, finishedAt, startedAt })),
  };
};
