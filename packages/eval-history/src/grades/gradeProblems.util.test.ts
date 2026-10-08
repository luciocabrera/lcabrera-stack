import { describe, expect, it } from 'vite-plus/test';

import { gradeProblems } from './gradeProblems.util.ts';

const judged = ['clarity', 'completeness'];

describe('gradeProblems', () => {
  it('finds nothing in scores for dimensions the judge scored', () => {
    expect(
      gradeProblems({
        judged,
        scores: [
          { dimension: 'clarity', score: 4 },
          { dimension: 'completeness', score: 2 },
        ],
        trialId: '9',
      }),
    ).toEqual([]);
  });

  it('refuses a trial with no quality judgement', () => {
    expect(
      gradeProblems({
        judged: [],
        scores: [{ dimension: 'clarity', score: 4 }],
        trialId: '9',
      }),
    ).toEqual(['trial 9 has no quality judgement to grade']);
  });

  it('asks for a score and lists the dimensions when none is given', () => {
    expect(gradeProblems({ judged, scores: [], trialId: '9' })).toEqual([
      'name at least one --score <dimension>=<1-5>; the judge scored clarity, completeness',
    ]);
  });

  it('names an unknown dimension and a repeated one', () => {
    expect(
      gradeProblems({
        judged,
        scores: [
          { dimension: 'tone', score: 3 },
          { dimension: 'clarity', score: 4 },
          { dimension: 'clarity', score: 5 },
        ],
        trialId: '9',
      }),
    ).toEqual([
      '"tone" is not a dimension the judge scored clarity, completeness',
      '"clarity" is scored more than once',
    ]);
  });
});
