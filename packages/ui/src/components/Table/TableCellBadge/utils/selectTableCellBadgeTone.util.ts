import type { TableCellBadgeParams } from '../TableCellBadge.types';

import { matchesTableCellBadgeRule } from './matchesTableCellBadgeRule.util';

type SelectTableCellBadgeToneArgs = {
  readonly params: TableCellBadgeParams;
  readonly value: unknown;
};

export const selectTableCellBadgeTone = ({
  params,
  value,
}: SelectTableCellBadgeToneArgs) =>
  params.rules.find((rule) => matchesTableCellBadgeRule({ rule, value }))
    ?.tone ?? params.fallbackTone;
