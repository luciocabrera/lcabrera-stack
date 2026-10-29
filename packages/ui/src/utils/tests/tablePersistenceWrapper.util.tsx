/**
 * Supplies the persistence a route-level Table layout gives its stack, so a
 * persist-action hook under test submits the way it does inside one.
 */

import type { ReactNode } from 'react';

import { TablePersistenceContext } from '#ui/components/Table/contexts/TableConfig/TablePersistenceContext.context';
import { useTablePersistence } from '#ui/components/Table/TableLayout/useTablePersistence.hook';

type TablePersistenceWrapperProps = {
  readonly children: ReactNode;
};

export const TablePersistenceWrapper = ({
  children,
}: TablePersistenceWrapperProps) => (
  <TablePersistenceContext value={useTablePersistence()}>
    {children}
  </TablePersistenceContext>
);
