import type {
  AdjudicationVerdict,
  GroundTruthSource,
} from './adjudications.types.ts';

import {
  ADJUDICATION_CASE_ID,
  ADJUDICATION_VERDICTS,
} from '../envelope/envelope.constants.ts';
import {
  DEFAULT_GROUND_TRUTH_SOURCE,
  GROUND_TRUTH_SOURCES,
} from './adjudications.constants.ts';

type GroundTruthRequestArgs = {
  readonly accuracy: boolean;
  readonly note: string | undefined;
  readonly positionals: readonly string[];
  readonly source: string | undefined;
};

const USAGE =
  'name the case and its true answer: <case_id> <REAL|FALSE_POSITIVE>, or pass --accuracy';

const isVerdict = (value: string): value is AdjudicationVerdict =>
  (ADJUDICATION_VERDICTS as readonly string[]).includes(value);

const isSource = (value: string): value is GroundTruthSource =>
  (GROUND_TRUTH_SOURCES as readonly string[]).includes(value);

type ProblemsArgs = {
  readonly caseId: string;
  readonly note: string | undefined;
  readonly source: string;
  readonly truth: string;
};

const problemsOf = ({ caseId, note, source, truth }: ProblemsArgs) => [
  ...(ADJUDICATION_CASE_ID.test(caseId)
    ? []
    : [`case ${caseId} is not a case id such as FP-0001`]),
  ...(isVerdict(truth)
    ? []
    : [`true answer ${truth} is not ${ADJUDICATION_VERDICTS.join(' or ')}`]),
  ...(isSource(source)
    ? []
    : [`--source ${source} is not one of ${GROUND_TRUTH_SOURCES.join(', ')}`]),
  ...(source === 'reopened' && truth !== 'REAL'
    ? ['a reopened dismissal is a real problem: record it as REAL']
    : []),
  ...(note?.trim() === '' ? ['--note is blank'] : []),
];

export const groundTruthRequest = ({
  accuracy,
  note,
  positionals,
  source = DEFAULT_GROUND_TRUTH_SOURCE,
}: GroundTruthRequestArgs) => {
  if (accuracy && positionals.length === 0) {
    return { kind: 'accuracy' } as const;
  }

  const [caseId, truth] = positionals;

  if (
    accuracy ||
    caseId === undefined ||
    truth === undefined ||
    positionals.length > 2
  ) {
    return { kind: 'invalid', problems: [USAGE] } as const;
  }

  const problems = problemsOf({ caseId, note, source, truth });

  return problems.length > 0 || !isVerdict(truth) || !isSource(source)
    ? ({ kind: 'invalid', problems } as const)
    : ({ caseId, kind: 'grade', note, source, truth } as const);
};
