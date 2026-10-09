import type { Rate } from '../stats/stats.types.ts';

export type HumanScore = {
  readonly dimension: string;
  readonly score: number;
};

export type JudgeAgreement = {
  readonly agreement: Rate;
  readonly judgeModel: string;
  readonly judgePromptHash: string;
  readonly meanGap: number;
};

export type JudgeAgreementRow = {
  readonly humanScore: number;
  readonly judgeModel: string;
  readonly judgePromptHash: string;
  readonly judgeScore: number;
};
