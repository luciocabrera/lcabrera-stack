import { describe, expect, it } from 'vite-plus/test';

import { judgeAgreement } from './judgeAgreement.util.ts';

const OPUS = 'claude-opus-5-5';
const PROMPT_A = 'a'.repeat(64);
const PROMPT_B = 'b'.repeat(64);

type GradedArgs = {
  readonly human: number;
  readonly judge: number;
  readonly prompt?: string;
};

const graded = ({ human, judge, prompt = PROMPT_A }: GradedArgs) => ({
  humanScore: human,
  judgeModel: OPUS,
  judgePromptHash: prompt,
  judgeScore: judge,
});

describe('judgeAgreement', () => {
  it('reports no judge when nothing is hand-graded', () => {
    expect(judgeAgreement({ minN: 6, rows: [], z: 1.96 })).toEqual([]);
  });

  it('counts an exact match as agreement and averages the absolute gap', () => {
    const rows = [
      graded({ human: 4, judge: 4 }),
      graded({ human: 3, judge: 3 }),
      graded({ human: 5, judge: 5 }),
      graded({ human: 4, judge: 2 }),
      graded({ human: 4, judge: 4 }),
      graded({ human: 2, judge: 3 }),
    ];
    const [result] = judgeAgreement({ minN: 6, rows, z: 1.96 });

    expect(result).toMatchObject({
      agreement: { k: 4, kind: 'rate', n: 6, rate: 4 / 6 },
      judgeModel: OPUS,
      judgePromptHash: PROMPT_A,
      meanGap: 0.5,
    });
  });

  it('keeps a changed judge prompt apart, since it is a different judge', () => {
    const results = judgeAgreement({
      minN: 1,
      rows: [
        graded({ human: 4, judge: 4 }),
        graded({ human: 2, judge: 4, prompt: PROMPT_B }),
      ],
      z: 1.96,
    });

    expect(
      results.map(({ agreement, judgePromptHash }) => [
        judgePromptHash,
        agreement.k,
        agreement.n,
      ]),
    ).toEqual([
      [PROMPT_A, 1, 1],
      [PROMPT_B, 0, 1],
    ]);
  });

  it('calls fewer grades than the floor insufficient instead of a rate', () => {
    const [result] = judgeAgreement({
      minN: 6,
      rows: [graded({ human: 4, judge: 4 }), graded({ human: 3, judge: 3 })],
      z: 1.96,
    });

    expect(result?.agreement).toEqual({ k: 2, kind: 'insufficient', n: 2 });
  });
});
