import { z } from 'zod';

import type { AdjudicationShape } from './envelope.types.ts';

type IssueArgs = {
  readonly message: string;
  readonly path: readonly (number | string)[];
};

const issue = ({ message, path }: IssueArgs) => ({
  code: 'custom' as const,
  message,
  path: [...path],
});

const RULED_OUTCOMES = new Set(['fixed', 'split']);

const isoDate = z.iso.date();

const rulingIssues = ({
  case: { created_at: createdAt },
  outcome,
  owner_ruling: ruling,
}: AdjudicationShape) => {
  if (ruling === undefined) return [];
  return [
    ...(RULED_OUTCOMES.has(outcome)
      ? []
      : [
          issue({
            message: `an owner ruling closes a split or fixed case, not a ${outcome} one`,
            path: ['owner_ruling'],
          }),
        ]),
    ...(isoDate.safeParse(ruling.at).success &&
    ruling.at < createdAt.slice(0, 10)
      ? [
          issue({
            message:
              'an owner ruling is dated on or after the day the case opened',
            path: ['owner_ruling', 'at'],
          }),
        ]
      : []),
  ];
};

export const adjudicationIssues = (shape: AdjudicationShape) => {
  const { outcome, verifiers } = shape;
  const verdicts = new Set(verifiers.map(({ verdict }) => verdict));
  const seats = verifiers.map(({ model, role }) => `${role}/${model}`);

  return [
    ...verifiers
      .map(({ verdict }, index) => ({ index, verdict }))
      .filter(({ verdict }) => outcome === 'dismissed' && verdict === 'REAL')
      .map(({ index }) =>
        issue({
          message: 'a dismissed case has only FALSE_POSITIVE verdicts',
          path: ['verifiers', index, 'verdict'],
        }),
      ),
    ...(outcome === 'split' && verdicts.size < 2
      ? [
          issue({
            message:
              'a split case holds both a REAL and a FALSE_POSITIVE verdict',
            path: ['outcome'],
          }),
        ]
      : []),
    ...seats
      .map((seat, index) => ({ index, seat }))
      .filter(({ index, seat }) => seats.indexOf(seat) !== index)
      .map(({ index, seat }) =>
        issue({
          message: `verifier ${seat} appears more than once`,
          path: ['verifiers', index, 'model'],
        }),
      ),
    ...rulingIssues(shape),
  ];
};
