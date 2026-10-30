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

export const adjudicationIssues = ({
  outcome,
  verifiers,
}: AdjudicationShape) => {
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
  ];
};
