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

/**
 * Binds one body cell to the grid's stored focus: whether it carries the tab
 * stop, and when it must take DOM focus.
 *
 * The first effect is what re-attaches focus to a node that did not exist when
 * it was asked for. A focus request outlives the row it names — the row can be
 * unmounted by a scroll and mount again later — so it is applied on whichever
 * render first has a node for it, including the cell's very first one. That is
 * the mechanism behind a focused row surviving a trip out of the virtualization
 * window (ADR-062).
 *
 * The second is its counterpart, and the reason the grid never ends up with no
 * tab stop at all: a browser does not reliably raise `focusout` for a node it
 * has removed, so the grid learns that its tab stop has lost its node from the
 * node itself rather than from an event that may never come.
 */
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
  // Held in a ref so the unmount effect below depends on the cell's address
  // alone. An action closure is a fresh identity on every render, and a
  // dependency that always changes would run the release on every render
  // instead of on the one that matters.
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
