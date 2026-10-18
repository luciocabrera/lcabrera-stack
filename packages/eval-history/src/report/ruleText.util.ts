import type { Regression, SideLabels, Suite } from './report.types.ts';

import { codeSpan } from './codeSpan.util.ts';
import { findingLine } from './findingLine.util.ts';
import { findingSubject } from './findingSubject.util.ts';
import { REGRESSION_NEEDS_DATABASE } from './report.constants.ts';

type RuleTextArgs = {
  readonly labels: SideLabels;
  readonly minTrialsForRate: number;
  readonly rule: Regression['rule'];
  readonly suite: Suite;
};

export const ruleText = ({
  labels,
  minTrialsForRate,
  rule,
  suite,
}: RuleTextArgs) => {
  switch (rule.kind) {
    case 'clear': {
      return 'Regression rule: nothing flagged.';
    }
    case 'incomparable': {
      return rule.reason === 'model-changed'
        ? 'Regression rule: not applied, because the two runs used different models.'
        : 'Regression rule: not applied, because the harness version differs between the runs, or from the baseline. Pass `--allow-harness-change` when the harness is the change under test.';
    }
    case 'insufficient': {
      return rule.unjudged.length === 0
        ? `Regression rule: insufficient data, so nothing is flagged. A pass rate needs ${String(minTrialsForRate)} counted trials on each side.`
        : `Regression rule: insufficient data, so nothing is flagged. Could not judge ${rule.unjudged.map((key) => codeSpan(key)).join(', ')}: too few counted trials, or no baseline row for that subject.`;
    }
    case 'needs-database': {
      return REGRESSION_NEEDS_DATABASE;
    }
    case 'no-baseline': {
      return `Regression rule: no baseline for ${rule.modelId ?? 'a run with no model'}, so nothing is flagged. Record one with \`vp run evals:baseline -- --suite ${suite}\` on that model before comparing.`;
    }
    case 'regression': {
      const subjects = [
        ...new Set(rule.findings.map((finding) => findingSubject(finding))),
      ];

      return [
        `**Regression flagged** in ${subjects.join(', ')}:`,
        ...rule.findings.map((finding) => findingLine({ finding, labels })),
      ].join('\n');
    }
  }
};
