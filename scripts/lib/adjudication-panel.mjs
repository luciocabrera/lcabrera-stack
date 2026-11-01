/**
 * The decisions behind `vp run adjudicate:panel`: who sits on the panel, what a
 * verdict must hold, the outcome three verdicts make, and the envelope, list
 * entry and upstream draft a unanimous dismissal produces. Pure: the runner
 * starts the sessions and writes the files.
 */
import { expiryFor } from './false-positives.mjs';

export const DEFAULT_SEATS = [
  { model: 'opus', role: 'judge' },
  { model: 'sonnet', role: 'judge' },
  { model: 'fable', role: 'adversary' },
];

const VERDICTS = new Set(['REAL', 'FALSE_POSITIVE']);

export const seatsFrom = ({ adversary, judges }) => {
  const [firstJudge, secondJudge] = judges ?? [];
  return [
    { model: firstJudge ?? DEFAULT_SEATS[0].model, role: 'judge' },
    { model: secondJudge ?? DEFAULT_SEATS[1].model, role: 'judge' },
    { model: adversary ?? DEFAULT_SEATS[2].model, role: 'adversary' },
  ];
};

export const seatProblems = ({ builderModel, seats }) => {
  const models = seats.map(({ model }) => model);
  return [
    ...(builderModel === undefined || builderModel.trim() === ''
      ? ['name the builder model with --builder-model']
      : []),
    ...(new Set(models).size === seats.length
      ? []
      : [
          `the three seats need three distinct models; got ${models.join(', ')}`,
        ]),
    ...(models.every((model) => model === builderModel)
      ? ["at least one seat must run on a model other than the builder's"]
      : []),
  ];
};

export const resolvedModelProblems = ({ builderModel, verifiers }) => {
  const models = verifiers.map(({ model }) => model);
  return [
    ...(new Set(models).size === models.length
      ? []
      : [`two seats resolved to the same model: ${models.join(', ')}`]),
    ...(models.some((model) => model !== builderModel)
      ? []
      : [`every seat resolved to the builder's model ${builderModel}`]),
  ];
};

const textAfter = ({ lines, prefix }) =>
  lines
    .map((line) => line.trim())
    .find((line) => line.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();

const citesALocation = (text) =>
  text.split(/\s+/u).some((word) => word.includes('/'));

const verdictProblem = ({ check, fix, verdict }) => {
  if (verdict === 'REAL') {
    return fix === undefined
      ? 'a REAL verdict needs a line starting "Fix:"'
      : undefined;
  }
  return check === undefined || !citesALocation(check)
    ? 'a FALSE_POSITIVE verdict needs a "Check:" line naming the file it looked in, as a path'
    : undefined;
};

export const parseVerdict = (text) => {
  const [first, ...rest] = text.trim().split('\n');
  const verdict = first.trim();
  if (!VERDICTS.has(verdict)) {
    return {
      problem: `line one is "${verdict}", not REAL or FALSE_POSITIVE`,
    };
  }
  const fix = textAfter({ lines: rest, prefix: 'Fix:' });
  const problem = verdictProblem({
    check: textAfter({ lines: rest, prefix: 'Check:' }),
    fix,
    verdict,
  });
  return problem === undefined
    ? { evidence: rest.join('\n').trim(), fixable: Boolean(fix), verdict }
    : { problem };
};

export const outcomeOf = ({ fixable, verifiers }) => {
  const verdicts = new Set(verifiers.map(({ verdict }) => verdict));
  if (!verdicts.has('REAL')) return 'dismissed';
  if (fixable) return 'fixed';
  return verdicts.size === 2 ? 'split' : 'escalated';
};

const NEXT_STEPS = {
  escalated:
    'The panel ruled REAL and gave no fix. Stop and ask the repository owner; do not mark or dismiss it.',
  fixed:
    'A REAL verdict gives a fix. Apply it; there is no marker. If the fix cannot be applied, stop and ask the repository owner.',
  split:
    'The panel split and no REAL verdict gives a fix. Stop and ask the repository owner; do not mark or dismiss it.',
};

export const nextStep = (outcome) => NEXT_STEPS[outcome];

export const verdictFileName = ({ model, role }) =>
  `${role}-${model.replaceAll(/[^\w.-]/gu, '_')}.verdict.md`;

export const assertUnruled = ({ caseId, ruled }) => {
  if (ruled) {
    throw new Error(
      `${caseId} already has a panel record; open a new case with vp run adjudicate to adjudicate it again`,
    );
  }
};

export const dispatchPrompt = (casePath) =>
  `The case file is ${casePath}. Read it and the repository, then answer in the verdict format your instructions give.`;

export const envelopeFor = ({ caseFile, fixable, verifiers }) => ({
  case: caseFile.case,
  outcome: outcomeOf({ fixable, verifiers }),
  schema_version: 1,
  verifiers,
});

export const listEntryFor = ({ caseFile, evidence }) => ({
  analyzer: caseFile.case.analyzer,
  case: caseFile.case.case_id,
  contentHash: caseFile.case.content_hash,
  evidence,
  expires: expiryFor(caseFile.case.created_at),
  file: caseFile.case.file,
  lines: caseFile.code.end - caseFile.code.start + 1,
  rule: caseFile.case.rule,
});

export const upstreamDraft = ({ caseFile, verifiers }) =>
  [
    `# Draft: ${caseFile.case.analyzer} reports ${caseFile.case.rule} on code it should not`,
    '',
    "> Not posted. Nothing here goes to the analyzer's tracker without the repository owner's explicit yes.",
    '',
    '## The finding',
    '',
    '```json',
    JSON.stringify(caseFile.finding, null, 2),
    '```',
    '',
    '## The code',
    '',
    '```',
    caseFile.code.context,
    '```',
    '',
    '## Why it is a false positive',
    '',
    ...verifiers.map(
      ({ evidence, model, role }) => `### ${role} (${model})\n\n${evidence}\n`,
    ),
  ].join('\n');
