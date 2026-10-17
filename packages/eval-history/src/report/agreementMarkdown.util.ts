import type { ReportAgreement, Thresholds } from './report.types.ts';

import { judgeAgreementLines } from '../grades/judgeAgreementLines.util.ts';
import {
  AGREEMENT_HEADING,
  AGREEMENT_NEEDS_DATABASE,
} from './report.constants.ts';

type AgreementMarkdownArgs = {
  readonly agreement: ReportAgreement;
  readonly thresholds: Thresholds;
};

export const agreementMarkdown = ({
  agreement,
  thresholds,
}: AgreementMarkdownArgs) =>
  [
    AGREEMENT_HEADING,
    ...(agreement.kind === 'read'
      ? judgeAgreementLines({
          judges: agreement.judges,
          minN: thresholds.minTrialsForRate,
          z: thresholds.z,
        })
      : [AGREEMENT_NEEDS_DATABASE]),
  ].join('\n\n');
