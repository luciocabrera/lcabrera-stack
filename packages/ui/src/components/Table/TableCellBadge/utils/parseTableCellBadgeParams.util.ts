import type {
  StandardSchemaV1Issue,
  StandardSchemaV1Result,
} from '#ui/components/Table/Table.types';

import { isTableCellToneName } from '#ui/components/Table/cellRenderers/isTableCellToneName.util';
import { readTableCellParams } from '#ui/components/Table/cellRenderers/readTableCellParams.util';

import type {
  TableCellBadgeParams,
  TableCellBadgeRule,
} from '../TableCellBadge.types';

import { findTableCellBadgeRuleIssue } from './findTableCellBadgeRuleIssue.util';
import { isTableCellBadgeRule } from './isTableCellBadgeRule.util';

const PARAM_KEYS = new Set(['fallbackTone', 'rules']);

export const parseTableCellBadgeParams = (
  value: unknown,
): StandardSchemaV1Result<TableCellBadgeParams> => {
  const read = readTableCellParams({ allowed: PARAM_KEYS, value });

  if ('issues' in read) return read;

  const { fallbackTone = 'neutral', rules } = read.record;
  if (!isTableCellToneName(fallbackTone)) {
    return {
      issues: [{ message: 'fallbackTone must be a tone name' }],
    };
  }
  if (!Array.isArray(rules)) {
    return { issues: [{ message: 'rules must be an array' }] };
  }

  const issues: StandardSchemaV1Issue[] = [];
  const validRules: TableCellBadgeRule[] = [];

  for (const [index, rule] of rules.entries()) {
    const message = findTableCellBadgeRuleIssue(rule);

    if (message !== undefined) {
      issues.push({ message: `rules[${index}]: ${message}` });
    } else if (isTableCellBadgeRule(rule)) {
      validRules.push(rule);
    }
  }

  if (issues.length > 0) return { issues };

  return { value: { fallbackTone, rules: validRules } };
};
