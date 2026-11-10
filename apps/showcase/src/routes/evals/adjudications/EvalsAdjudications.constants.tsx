import type { BreadcrumbHandle } from '@lcabrera/ui';
import type { HeatmapLegendItem } from '@lcabrera/ui/components/Heatmap';
import type { TableColumn } from '@lcabrera/ui/components/Table';

import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';
import { Text } from '@lcabrera/ui/components/Text';

import type {
  BuilderAccuracyRow,
  CaseRow,
  ModelAccuracyRow,
  ModelCostRow,
  PromptAccuracyRow,
  RuleRateRow,
} from './EvalsAdjudications.types';

import { HEAT_TONES } from '../heatmap/EvalsHeatmap.constants';

export const EVALS_ADJUDICATIONS_HANDLE = {
  breadcrumb: () => [
    { label: 'Evals', to: '/evals' },
    { label: 'adjudications' },
  ],
} satisfies BreadcrumbHandle;

export const EVALS_ADJUDICATION_CASES = 100;

export const UNRECORDED_BUILDER = 'not recorded';

export const OUTCOME_TONES = {
  dismissed: 'success',
  escalated: 'error',
  fixed: 'info',
  split: 'warning',
} as const;

export const ACCURACY_LEGEND = [
  { label: '90% or more correct', tone: HEAT_TONES.high },
  { label: '50% or more correct', tone: HEAT_TONES.mid },
  { label: 'Below 50% correct', tone: HEAT_TONES.low },
  { label: 'No true answer yet', tone: HEAT_TONES.none },
] as const satisfies readonly HeatmapLegendItem[];

export const CASE_COLUMNS: readonly TableColumn<CaseRow>[] = [
  { key: 'caseId', label: 'Case' },
  { dataType: 'string', key: 'opened', label: 'Opened' },
  { key: 'analyzer', label: 'Analyzer' },
  { key: 'rule', label: 'Rule' },
  { key: 'pr', label: 'PR' },
  {
    key: 'outcome',
    label: 'Outcome',
    render: ({ outcome }) => (
      <StatusBadge label={outcome} tone={OUTCOME_TONES[outcome]} />
    ),
  },
  { key: 'panel', label: 'Panel' },
  { key: 'truth', label: 'True answer' },
  { align: 'end', key: 'cost', label: 'Cost' },
  { align: 'end', key: 'duration', label: 'Slowest seat' },
  { key: 'builder', label: 'Builder model' },
];

export const ACCURACY_COLUMNS: readonly TableColumn<ModelAccuracyRow>[] = [
  { key: 'model', label: 'Model' },
  { key: 'role', label: 'Role' },
  { align: 'end', dataType: 'number', key: 'verdicts', label: 'Verdicts' },
  { align: 'end', dataType: 'number', key: 'correct', label: 'Correct' },
  { align: 'end', key: 'accuracy', label: 'Accuracy' },
  { key: 'interval', label: 'Interval' },
  {
    align: 'end',
    dataType: 'number',
    key: 'missedReal',
    label: 'Missed a real finding',
  },
  {
    align: 'end',
    dataType: 'number',
    key: 'falseAlarms',
    label: 'Called a false positive real',
  },
];

export const PROMPT_COLUMNS: readonly TableColumn<PromptAccuracyRow>[] = [
  { key: 'role', label: 'Role' },
  {
    key: 'prompt',
    label: 'Prompt hash',
    render: ({ prompt }) => (
      <Text as='span' isMono size='sm'>
        {prompt}
      </Text>
    ),
  },
  { dataType: 'string', key: 'firstSeen', label: 'First case' },
  { align: 'end', dataType: 'number', key: 'verdicts', label: 'Verdicts' },
  { align: 'end', key: 'accuracy', label: 'Accuracy' },
];

export const RULE_COLUMNS: readonly TableColumn<RuleRateRow>[] = [
  { key: 'analyzer', label: 'Analyzer' },
  { key: 'rule', label: 'Rule' },
  { align: 'end', dataType: 'number', key: 'cases', label: 'Cases' },
  { align: 'end', dataType: 'number', key: 'dismissed', label: 'Dismissed' },
  {
    align: 'end',
    dataType: 'number',
    key: 'answered',
    label: 'With a true answer',
  },
  {
    align: 'end',
    dataType: 'number',
    key: 'falsePositives',
    label: 'False positives',
  },
  { align: 'end', key: 'rate', label: 'False-positive rate' },
  { align: 'end', dataType: 'number', key: 'reopened', label: 'Reopened' },
];

export const COST_COLUMNS: readonly TableColumn<ModelCostRow>[] = [
  { key: 'model', label: 'Model' },
  { align: 'end', dataType: 'number', key: 'verdicts', label: 'Verdicts' },
  { align: 'end', dataType: 'number', key: 'cases', label: 'Cases' },
  { align: 'end', key: 'cost', label: 'Reported cost' },
  { align: 'end', key: 'costPerVerdict', label: 'Per verdict' },
  { align: 'end', key: 'duration', label: 'Mean time' },
  { align: 'end', dataType: 'number', key: 'tokensIn', label: 'Tokens in' },
  { align: 'end', dataType: 'number', key: 'tokensOut', label: 'Tokens out' },
];

export const BUILDER_COLUMNS: readonly TableColumn<BuilderAccuracyRow>[] = [
  { key: 'builder', label: 'Builder model' },
  { align: 'end', dataType: 'number', key: 'cases', label: 'Cases' },
  { align: 'end', dataType: 'number', key: 'dismissed', label: 'Dismissed' },
  { align: 'end', key: 'accuracy', label: 'Panel accuracy' },
];
