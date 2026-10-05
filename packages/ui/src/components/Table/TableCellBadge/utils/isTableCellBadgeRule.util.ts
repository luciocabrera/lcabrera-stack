import type { TableCellBadgeRule } from '../TableCellBadge.types';

import { findTableCellBadgeRuleIssue } from './findTableCellBadgeRuleIssue.util';

export const isTableCellBadgeRule = (
  rule: unknown,
): rule is TableCellBadgeRule =>
  findTableCellBadgeRuleIssue(rule) === undefined;
