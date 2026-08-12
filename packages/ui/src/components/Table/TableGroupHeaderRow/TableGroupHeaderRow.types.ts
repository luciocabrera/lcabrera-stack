import type { ComponentPropsWithoutRef } from 'react';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

/**
 * Native `<tr>` attributes are forwarded so a group row can carry the same
 * `aria-rowindex` every other body row does — it is one row of the grid's
 * sequence, not an annotation beside it (ADR-062).
 */
export type TableGroupHeaderRowProps = ComponentPropsWithoutRef<'tr'> & {
  readonly summary: TableGroupRowSummary;
};
