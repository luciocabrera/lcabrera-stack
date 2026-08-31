import { useEffect, useRef } from 'react';

import {
  useFocusTableCell,
  useReleaseTableGridFocus,
} from '#ui/components/Table/contexts/TableFocus/focus/actions';
import {
  useGetIsTableCellTabStop,
  useGetTableCellFocusRequest,
} from '#ui/components/Table/contexts/TableFocus/focus/selectors';

import type { UseTableCellFocusArgs } from './useTableCellFocus.types';

import { getShouldApplyCellFocus } from './utils/getShouldApplyCellFocus.util';

export const useTableCellFocus = ({
  columnKey,
  rowIndex,
  rowKey,
}: UseTableCellFocusArgs) => {
  const cellRef = useRef<HTMLTableCellElement>(null);
  const isTabStop = useGetIsTableCellTabStop({ columnKey, rowKey });
  const focusRequestId = useGetTableCellFocusRequest({ columnKey, rowKey });
  const focusTableCell = useFocusTableCell();
  const releaseTableGridFocus = useReleaseTableGridFocus();
  const releaseTableGridFocusRef = useRef(releaseTableGridFocus);

  useEffect(() => {
    releaseTableGridFocusRef.current = releaseTableGridFocus;
  });

  useEffect(() => {
    const cell = cellRef.current;

    if (focusRequestId === 0 || cell === null) return;

    const shouldApply = getShouldApplyCellFocus({
      activeElement: cell.ownerDocument.activeElement,
      cell,
    });

    if (shouldApply) cell.focus();
  }, [focusRequestId]);

  useEffect(() => {
    if (!isTabStop) return;

    return () => {
      releaseTableGridFocusRef.current({ columnKey, rowKey });
    };
  }, [columnKey, isTabStop, rowKey]);

  const handleFocus = () => {
    focusTableCell({ columnKey, rowIndex, rowKey });
  };

  return {
    cellRef,
    onFocus: handleFocus,
    tabIndex: isTabStop ? 0 : -1,
  };
};
