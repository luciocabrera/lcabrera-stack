import { isOlapGroupPeriod } from '@lcabrera/api/olap/is-olap-group-period.util';

import type { TableGroupPeriod } from '#ui/components/Table/Table.types';

/**
 * A re-export in substance, and named in this package's own terms for the reason
 * `TableGroupPeriod` is: the vocabulary belongs to the wire (ADR-082), so there is one
 * guard rather than a second that could drift — but a Table component asks about a *table
 * group period*, not about an OLAP request.
 */
export const isTableGroupPeriod = (value: unknown): value is TableGroupPeriod =>
  isOlapGroupPeriod(value);
