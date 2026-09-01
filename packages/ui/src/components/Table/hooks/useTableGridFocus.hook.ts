import type { FocusEvent, KeyboardEvent } from 'react';

import {
  useEnterTableGrid,
  useLeaveTableGrid,
  useMoveTableGridFocus,
} from '#ui/components/Table/contexts/TableFocus/focus/actions';
import { useGetIsTableGridTabStop } from '#ui/components/Table/contexts/TableFocus/focus/selectors';

import { activateGridCellLink } from './utils/activateGridCellLink.util';
import { getIsGridNavigationTarget } from './utils/getIsGridNavigationTarget.util';

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
