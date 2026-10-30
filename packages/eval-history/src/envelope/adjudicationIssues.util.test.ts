import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { AdjudicationShape } from './envelope.types.ts';

import { adjudicationShapeSchema } from './adjudicationEnvelope.schema.ts';
import { adjudicationIssues } from './adjudicationIssues.util.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('fixtures', import.meta.url)),
});
const fixture: AdjudicationShape = adjudicationShapeSchema.parse(
  fixtures.get('adjudication.json'),
);

const verifierAt = (index: number) => {
  const verifier = fixture.verifiers[index];

  if (!verifier) {
    throw new Error(
      `the adjudication fixture has no verifier ${String(index)}`,
    );
  }

  return verifier;
};

const judge = verifierAt(0);
const secondJudge = verifierAt(1);
const adversary = verifierAt(2);

const named = (shape: AdjudicationShape) =>
  adjudicationIssues(shape).map(({ message, path }) => [
    path.join('.'),
    message,
  ]);

describe('adjudicationIssues', () => {
  it('finds nothing wrong with a unanimous dismissal', () => {
    expect(adjudicationIssues(fixture)).toEqual([]);
  });

  it('names every REAL verdict on a dismissed case', () => {
    expect(
      named({
        ...fixture,
        verifiers: [
          { ...judge, verdict: 'REAL' },
          secondJudge,
          { ...adversary, verdict: 'REAL' },
        ],
      }),
    ).toEqual([
      [
        'verifiers.0.verdict',
        'a dismissed case has only FALSE_POSITIVE verdicts',
      ],
      [
        'verifiers.2.verdict',
        'a dismissed case has only FALSE_POSITIVE verdicts',
      ],
    ]);
  });

  it('names a unanimous split, and a repeated verifier by its role and model', () => {
    expect(
      named({ ...fixture, outcome: 'split', verifiers: [judge, judge] }),
    ).toEqual([
      [
        'outcome',
        'a split case holds both a REAL and a FALSE_POSITIVE verdict',
      ],
      [
        'verifiers.1.model',
        'verifier judge/claude-opus-5-5 appears more than once',
      ],
    ]);
  });

  it('lets the same model sit once as judge and once as adversary', () => {
    expect(
      adjudicationIssues({
        ...fixture,
        verifiers: [judge, { ...adversary, model: judge.model }],
      }),
    ).toEqual([]);
  });
});
