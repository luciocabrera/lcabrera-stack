import type {
  Regression,
  RuleFinding,
  Suite,
  TaskSubject,
} from './report.types.ts';
import type { sideLabels } from './sideLabels.util.ts';

import { formatPercent } from '../grades/formatPercent.util.ts';
import { flipCell } from './flipCell.util.ts';
import { REGRESSION_NEEDS_DATABASE } from './report.constants.ts';

type Labels = RegressionMarkdownArgs['labels'];

type RegressionMarkdownArgs = {
  readonly labels: ReturnType<typeof sideLabels>;
  readonly minTrialsForRate: number;
  readonly regression: Regression;
  readonly suite: Suite;
};

const codeSpan = (text: string) => `\`${text}\``;

const subjectText = (subject: TaskSubject | undefined) =>
  subject === undefined
    ? 'the suite as a whole'
    : `${subject.kind} \`${subject.name}\``;

const findingSubject = (finding: RuleFinding) =>
  finding.kind === 'rate'
    ? 'the suite pass rate'
    : subjectText(finding.subject);

const findingLine = ({
  finding,
  labels,
}: {
  readonly finding: RuleFinding;
  readonly labels: Labels;
}) => {
  if (finding.kind === 'rate') {
    return finding.main.kind === 'rate' && finding.pr.kind === 'rate'
      ? `- the suite pass rate: ${formatPercent(finding.pr.rate)} on ${labels.b}, below ${formatPercent(finding.main.lower)}, the lower bound of ${labels.a}'s Wilson interval`
      : '- the suite pass rate';
  }

  return finding.kind === 'flip'
    ? `- ${subjectText(finding.subject)}: \`${finding.taskKey}\` failed ${String(finding.failed)} of ${String(finding.trials)} counted trials on ${labels.b} after passing every trial on ${labels.a}`
    : `- ${subjectText(finding.subject)}: mean judge score ${finding.mean.toFixed(2)} on ${labels.b}, below ${finding.threshold.toFixed(2)}, the baseline mean less \`scored.sigma\` standard deviations`;
};

const ruleText = ({
  labels,
  minTrialsForRate,
  regression: { rule },
  suite,
}: RegressionMarkdownArgs) => {
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
        : `Regression rule: insufficient data, so nothing is flagged. Too few counted trials to judge ${rule.unjudged.map((key) => codeSpan(key)).join(', ')}.`;
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

const flakyText = ({ labels, regression }: RegressionMarkdownArgs) =>
  regression.flaky.length === 0
    ? []
    : [
        [
          'Flaky, left out of the rule:',
          ...regression.flaky.map(
            ({ a, b, disagreeing, runs, taskKey }) =>
              `- \`${taskKey}\`: ${labels.a} ${flipCell(a)}, ${labels.b} ${flipCell(b)}; its trials disagreed in ${String(disagreeing)} of its last ${String(runs)} runs`,
          ),
        ].join('\n'),
      ];

export const regressionMarkdown = (args: RegressionMarkdownArgs) =>
  [ruleText(args), ...flakyText(args)].join('\n\n');
