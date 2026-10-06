import type {
  TableCellCall,
  TableCellPalette,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

import type { SkillScoreRow } from './SkillScores.types';

export const PERSISTENCE_KEY = 'skill-scores-table';
export const TABLE_NAME = 'skill_scores';
export const TITLE = {
  plural: 'Every skill',
  singular: 'Skill',
};

export const CELL_PALETTE: TableCellPalette = {
  caution: {
    dark: { background: 'oklch(0.55 0.14 55)', text: 'oklch(0.97 0.01 55)' },
    light: { background: 'oklch(0.75 0.15 55)', text: 'oklch(0.25 0.05 55)' },
  },
};

const SCORE_CELL: TableCellCall = {
  kind: 'badge',
  params: {
    rules: [
      { gte: 4, tone: 'success' },
      { gte: 3, tone: 'warning' },
      { gte: 2, tone: 'caution' },
      { gte: 0, tone: 'error' },
    ],
  },
};

const SCORE_COLUMN = {
  cell: SCORE_CELL,
  dataType: 'number',
  isFilterable: false,
  minWidth: 130,
} as const;

export const COLUMNS: TableColumn<SkillScoreRow>[] = [
  {
    cell: { kind: 'text', params: { monospace: true } },
    dataType: 'string',
    isFilterable: false,
    isPrimaryKey: true,
    key: 'skill',
    label: 'Skill',
    minWidth: 240,
  },
  { ...SCORE_COLUMN, key: 'clarity', label: 'Clarity' },
  { ...SCORE_COLUMN, key: 'completeness', label: 'Completeness' },
  { ...SCORE_COLUMN, key: 'trigger_precision', label: 'Trigger Precision' },
  { ...SCORE_COLUMN, key: 'scope_coverage', label: 'Scope Coverage' },
  { ...SCORE_COLUMN, key: 'anti_patterns', label: 'Anti Patterns' },
  {
    cell: { kind: 'text', params: { weight: 'bold' } },
    dataType: 'number',
    format: { number: { maximumFractionDigits: 1, minimumFractionDigits: 1 } },
    isFilterable: false,
    key: 'overall',
    label: 'Overall',
    minWidth: 110,
  },
  {
    cell: {
      kind: 'delta',
      params: {
        decrease: 'error',
        increase: 'success',
        precision: 1,
        unchanged: 'neutral',
      },
    },
    dataType: 'number',
    isFilterable: false,
    key: 'change',
    label: 'Change',
    minWidth: 110,
  },
];

export const SKILL_SCORE_ROWS: readonly SkillScoreRow[] = [
  {
    anti_patterns: 3,
    change: 0,
    clarity: 4,
    completeness: 3,
    overall: 3.2,
    scope_coverage: 3,
    skill: 'codebase-explorer',
    trigger_precision: 3,
  },
  {
    anti_patterns: 4,
    change: 0,
    clarity: 4,
    completeness: 3,
    overall: 3.8,
    scope_coverage: 4,
    skill: 'epic',
    trigger_precision: 4,
  },
  {
    anti_patterns: 3,
    change: 0,
    clarity: 4,
    completeness: 3,
    overall: 3.2,
    scope_coverage: 3,
    skill: 'fallow-code-checker',
    trigger_precision: 3,
  },
  {
    anti_patterns: 3,
    change: 0,
    clarity: 4,
    completeness: 3,
    overall: 3.4,
    scope_coverage: 4,
    skill: 'linter-checker',
    trigger_precision: 3,
  },
  {
    anti_patterns: 3,
    change: 0,
    clarity: 4,
    completeness: 3,
    overall: 3.4,
    scope_coverage: 4,
    skill: 'react-19',
    trigger_precision: 3,
  },
  {
    anti_patterns: 3,
    change: 0,
    clarity: 4,
    completeness: 3,
    overall: 3.2,
    scope_coverage: 3,
    skill: 'react-router-framework-mode',
    trigger_precision: 3,
  },
  {
    anti_patterns: 3,
    change: -0.2,
    clarity: 4,
    completeness: 3,
    overall: 3.2,
    scope_coverage: 3,
    skill: 'store-pattern',
    trigger_precision: 3,
  },
  {
    anti_patterns: 2,
    change: 0,
    clarity: 3,
    completeness: 3,
    overall: 2.4,
    scope_coverage: 2,
    skill: 'typescript-api-engineering',
    trigger_precision: 2,
  },
  {
    anti_patterns: 3,
    change: 0.3,
    clarity: 4,
    completeness: 4,
    overall: 3.4,
    scope_coverage: 3,
    skill: 'code-smell-checker',
    trigger_precision: 3,
  },
  {
    anti_patterns: 4,
    change: 0.6,
    clarity: 1,
    completeness: 2,
    overall: 2.8,
    scope_coverage: 4,
    skill: 'unslop',
    trigger_precision: 3,
  },
];
