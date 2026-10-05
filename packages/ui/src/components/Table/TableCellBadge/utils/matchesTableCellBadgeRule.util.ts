import { parseNumberValue } from '#ui/components/Table/TableBodyCell/utils/parseNumberValue.util';

import type { TableCellBadgeRule } from '../TableCellBadge.types';

type MatchesTableCellBadgeRuleArgs = {
  readonly rule: TableCellBadgeRule;
  readonly value: unknown;
};

export const matchesTableCellBadgeRule = ({
  rule,
  value,
}: MatchesTableCellBadgeRuleArgs) => {
  const { equals, gte, lt } = rule;
  const numeric = parseNumberValue(value);

  if (gte !== undefined && (numeric === undefined || numeric < gte)) {
    return false;
  }

  if (lt !== undefined && (numeric === undefined || numeric >= lt)) {
    return false;
  }

  if (equals === undefined) return true;

  if (typeof equals === 'number') return numeric === equals;

  return value === equals || String(value) === String(equals);
};
