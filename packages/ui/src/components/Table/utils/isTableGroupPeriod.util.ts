import { isOlapGroupPeriod } from '@lcabrera/api/olap/is-olap-group-period.util';

import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

export const isTableGroupPeriod = (value: unknown): value is TableGroupPeriod =>
  isOlapGroupPeriod(value);
