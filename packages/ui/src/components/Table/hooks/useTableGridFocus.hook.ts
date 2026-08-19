import type { FocusEvent, KeyboardEvent } from 'react';

import {
  useEnterTableGrid,
  useLeaveTableGrid,
  useMoveTableGridFocus,
} from '#ui/components/Table/contexts/TableFocus/focus/actions';
import { useGetIsTableGridTabStop } from '#ui/components/Table/contexts/TableFocus/focus/selectors';

import { activateGridCellLink } from './utils/activateGridCellLink.util';
import { getIsGridNavigationTarget } from './utils/getIsGridNavigationTarget.util';

/**
 * Everything the `role="grid"` element needs to be the grid's tab stop and its
 * keyboard surface.
 *
 * The container is focusable whenever no rendered cell holds the tab stop, so
 * the grid is always exactly one stop in the page's tab order — including while
 * the focused row sits outside the virtualization window and therefore has no
 * node at all (ADR-062).
 *
 * `focusout` carries the element focus is moving *to*, which is what
 * distinguishes leaving the grid from moving between two cells inside it; a
 * row unmounting under focus reports no such element, and that is correctly
 * read as leaving.
 *
 * `Enter` is the one key here that acts rather than navigates — see
 * `activateGridCellLink` for why a cell's link cannot be a tab stop of its own.
 */
export const useTableGridFocus = <TData extends Record<string, unknown>>() => {
  const isTabStop = useGetIsTableGridTabStop();
  const enterTableGrid = useEnterTableGrid<TData>();
  const leaveTableGrid = useLeaveTableGrid();
  const moveTableGridFocus = useMoveTableGridFocus<TData>();

  const handleBlur = (event: FocusEvent<HTMLTableElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;

    leaveTableGrid();
  };

  const handleFocus = (event: FocusEvent<HTMLTableElement>) => {
    enterTableGrid({ isGridElement: event.target === event.currentTarget });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const isOwnEvent = getIsGridNavigationTarget({
      grid: event.currentTarget,
      target: event.target,
    });

    if (!isOwnEvent) return;

    // `Enter` acts on the focused cell rather than moving it. The grid claims
    // it only when the cell actually holds a link, so an ordinary cell leaves
    // the key to the page.
    if (event.key === 'Enter' && activateGridCellLink(event.target)) {
      event.preventDefault();

      return;
    }

    const wasHandled = moveTableGridFocus({
      isRangeModifier: event.ctrlKey || event.metaKey,
      key: event.key,
    });

    if (wasHandled) event.preventDefault();
  };

  return {
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    tabIndex: isTabStop ? 0 : -1,
  };
};
