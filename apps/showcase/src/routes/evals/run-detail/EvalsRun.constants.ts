import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import type { TrialTableRow } from '../types/trialTableRow.types';

export const PERSISTENCE_KEY = 'evals-run-trials-table';
export const TABLE_NAME = 'eval_trial';
export const TITLE = {
  plural: 'Trials',
  singular: 'Trial',
};

const STRING_COLUMN = {
  dataType: 'string',
  isFilterable: false,
  minWidth: 140,
} as const;

const NUMBER_COLUMN = {
  dataType: 'number',
  isFilterable: false,
  minWidth: 110,
} as const;

export const COLUMNS: TableColumn<TrialTableRow>[] = [
  {
    ...STRING_COLUMN,
    isPrimaryKey: true,
    key: 'trialId',
    label: 'Trial',
    minWidth: 90,
  },
  {
    ...STRING_COLUMN,
    cell: { kind: 'text', params: { monospace: true } },
    key: 'taskKey',
    label: 'Task',
    minWidth: 280,
  },
  { ...STRING_COLUMN, key: 'subjectName', label: 'Subject', minWidth: 180 },
  { ...STRING_COLUMN, key: 'taskKind', label: 'Kind', minWidth: 110 },
  { ...NUMBER_COLUMN, key: 'trialIndex', label: 'Index' },
  { ...STRING_COLUMN, key: 'outcome', label: 'Outcome', minWidth: 110 },
  { ...STRING_COLUMN, key: 'errorClass', label: 'Error class' },
  { ...NUMBER_COLUMN, key: 'durationMs', label: 'Duration (ms)' },
  { ...NUMBER_COLUMN, key: 'turns', label: 'Turns' },
  { ...NUMBER_COLUMN, key: 'tokensIn', label: 'Tokens in' },
  { ...NUMBER_COLUMN, key: 'tokensOut', label: 'Tokens out' },
  {
    ...NUMBER_COLUMN,
    format: { number: { maximumFractionDigits: 4, minimumFractionDigits: 2 } },
    key: 'costUsd',
    label: 'Cost (USD)',
  },
  { ...STRING_COLUMN, key: 'expectedSkill', label: 'Expected skill' },
  { ...STRING_COLUMN, key: 'invoked', label: 'Invoked', minWidth: 200 },
  { ...STRING_COLUMN, key: 'verdict', label: 'Verdict', minWidth: 100 },
  { ...NUMBER_COLUMN, key: 'overall', label: 'Overall' },
];
