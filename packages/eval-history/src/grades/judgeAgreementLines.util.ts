import type { JudgeAgreement } from './grades.types.ts';

import { formatPercent } from './formatPercent.util.ts';

type JudgeAgreementLinesArgs = {
  readonly judges: readonly JudgeAgreement[];
  readonly minN: number;
  readonly z: number;
};

const PROMPT_HASH_SHOWN = 12;

export const judgeAgreementLines = ({
  judges,
  minN,
  z,
}: JudgeAgreementLinesArgs) =>
  judges.length === 0
    ? [
        'Judge agreement: no hand grades yet; record one with vp run evals:grade -- --trial <id> --score <dimension>=<1-5>',
      ]
    : judges.map(({ agreement, judgeModel, judgePromptHash, meanGap }) => {
        const judge = `${judgeModel}, judge prompt ${judgePromptHash.slice(0, PROMPT_HASH_SHOWN)}`;
        const counts = `n=${String(agreement.n)} graded scores, ${String(agreement.k)} equal to the judge's`;
        const gap = `mean gap ${meanGap.toFixed(2)} points`;

        return agreement.kind === 'rate'
          ? `Judge agreement (${judge}): ${formatPercent(agreement.rate)} (${counts}; Wilson interval ${formatPercent(agreement.lower)}–${formatPercent(agreement.upper)} at z=${String(z)}); ${gap}`
          : `Judge agreement (${judge}): insufficient data (${counts}; a rate needs ${String(minN)}); ${gap}`;
      });
