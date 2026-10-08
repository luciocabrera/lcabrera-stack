import { describe, expect, it } from 'vite-plus/test';

import { gradeRequest } from './gradeRequest.util.ts';

const args = {
  agreement: false,
  grader: 'lucio',
  scores: ['clarity=4', 'completeness=2'],
  trial: '42',
};

describe('gradeRequest', () => {
  it('reads a grade of named dimensions on one trial', () => {
    expect(gradeRequest(args)).toEqual({
      grader: 'lucio',
      kind: 'grade',
      scores: [
        { dimension: 'clarity', score: 4 },
        { dimension: 'completeness', score: 2 },
      ],
      trialId: '42',
    });
  });

  it('asks only for the agreement when --agreement is passed', () => {
    expect(
      gradeRequest({ ...args, agreement: true, trial: undefined }),
    ).toEqual({ kind: 'agreement' });
  });

  it.each([{ trial: undefined }, { trial: '0' }, { trial: 'x' }])(
    'refuses trial $trial',
    ({ trial }) => {
      expect(gradeRequest({ ...args, trial })).toEqual({
        kind: 'invalid',
        problems: [
          'name the trial to grade with --trial <id>, or pass --agreement',
        ],
      });
    },
  );

  it('names every score argument it cannot read', () => {
    expect(
      gradeRequest({
        ...args,
        scores: ['clarity=9', 'completeness=2', 'tone'],
      }),
    ).toEqual({
      kind: 'invalid',
      problems: [
        '--score clarity=9 is not <dimension>=<a whole number from 1 to 5>',
        '--score tone is not <dimension>=<a whole number from 1 to 5>',
      ],
    });
  });
});
