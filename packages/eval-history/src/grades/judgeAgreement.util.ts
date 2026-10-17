import type { JudgeAgreement, JudgeAgreementRow } from './grades.types.ts';

import { wilson } from '../stats/wilson.util.ts';

type Judge = Pick<JudgeAgreementRow, 'judgeModel' | 'judgePromptHash'> & {
  readonly gaps: readonly number[];
};

type JudgeAgreementArgs = {
  readonly minN: number;
  readonly rows: readonly JudgeAgreementRow[];
  readonly z: number;
};

export const judgeAgreement = ({ minN, rows, z }: JudgeAgreementArgs) => {
  const judges = new Map<string, Judge>();

  for (const { humanScore, judgeModel, judgePromptHash, judgeScore } of rows) {
    const key = JSON.stringify([judgeModel, judgePromptHash]);
    const gap = Math.abs(humanScore - judgeScore);

    judges.set(key, {
      gaps: [...(judges.get(key)?.gaps ?? []), gap],
      judgeModel,
      judgePromptHash,
    });
  }

  return judges
    .values()
    .map(({ gaps, judgeModel, judgePromptHash }): JudgeAgreement => ({
      agreement: wilson({
        k: gaps.filter((gap) => gap === 0).length,
        minN,
        n: gaps.length,
        z,
      }),
      judgeModel,
      judgePromptHash,
      meanGap: gaps.reduce((total, gap) => total + gap, 0) / gaps.length,
    }))
    .toArray();
};
