import { describe, expect, it } from 'vite-plus/test';

import { judgeAgreementLines } from './judgeAgreementLines.util.ts';

const judge = {
  judgeModel: 'claude-opus-5-5',
  judgePromptHash:
    '9732c83e3e03fffde2ee65a9d826df8c4dd623c27fb92b952fe62a02f0726f87',
};

describe('judgeAgreementLines', () => {
  it('says how to record a grade when there are none', () => {
    expect(judgeAgreementLines({ judges: [], minN: 6, z: 1.96 })).toEqual([
      'Judge agreement: no hand grades yet; record one with vp run evals:grade -- --trial <id> --score <dimension>=<1-5>',
    ]);
  });

  it('prints the rate with n, its interval and the mean gap', () => {
    expect(
      judgeAgreementLines({
        judges: [
          {
            ...judge,
            agreement: {
              k: 7,
              kind: 'rate',
              lower: 0.397,
              n: 10,
              rate: 0.7,
              upper: 0.892,
            },
            meanGap: 0.3,
          },
        ],
        minN: 6,
        z: 1.96,
      }),
    ).toEqual([
      "Judge agreement (claude-opus-5-5, judge prompt 9732c83e3e03): 70.0% (n=10 graded scores, 7 equal to the judge's; Wilson interval 39.7%–89.2% at z=1.96); mean gap 0.30 points",
    ]);
  });

  it('prints insufficient data below the floor rather than a rate', () => {
    expect(
      judgeAgreementLines({
        judges: [
          {
            ...judge,
            agreement: { k: 2, kind: 'insufficient', n: 3 },
            meanGap: 1 / 3,
          },
        ],
        minN: 6,
        z: 1.96,
      }),
    ).toEqual([
      "Judge agreement (claude-opus-5-5, judge prompt 9732c83e3e03): insufficient data (n=3 graded scores, 2 equal to the judge's; a rate needs 6); mean gap 0.33 points",
    ]);
  });
});
