import type {
  ReportAgreement,
  RunComparison,
  Thresholds,
} from './report.types.ts';

import { agreementMarkdown } from './agreementMarkdown.util.ts';
import { comparisonMarkdown } from './comparisonMarkdown.util.ts';
import { refusalMarkdown } from './refusalMarkdown.util.ts';

type ReportMarkdownArgs = {
  readonly agreement: ReportAgreement;
  readonly comparisons: readonly RunComparison[];
  readonly thresholds: Thresholds;
};

export const reportMarkdown = ({
  agreement,
  comparisons,
  thresholds,
}: ReportMarkdownArgs) =>
  [
    ...comparisons.map((comparison) =>
      comparison.kind === 'comparison'
        ? comparisonMarkdown(comparison)
        : refusalMarkdown(comparison),
    ),
    agreementMarkdown({ agreement, thresholds }),
  ].join('\n\n');
