import type { DataKey } from '@lcabrera/ui/components/Table/Table.types';

import {
  useSetColumnSizingWithoutSync,
  useSyncColumnsSizing,
} from '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions';
import { useEffect, useRef, useState } from 'react';

import { startColumnResizeSession } from './utils/startColumnResizeSession.service';

type UseColumnDragSessionArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

/**
 * The pointer half of a column resize. Private to `useColumnResize`, which is
 * the single entry point a component should use.
 *
 * Each mouse down opens a self-contained drag session
 * (`startColumnResizeSession`), which owns the start snapshot, the
 * RAF-throttled move handler emitting clamped widths, and the paired teardown.
 * This hook holds only the pointer state around it: which session is in flight,
 * and whether the column is currently resizing. Unmount ends any in-flight
 * session through `endDragSessionRef`.
 *
 * The gesture owns both halves of its own write: frames go through
 * `useSetColumnSizingWithoutSync` (store only, so a drag does not rewrite the
 * cookie at 60fps) and mouse up persists once.
 */
export const useColumnDragSession = <TData>({
  columnKey,
  currentWidth,
  maxWidth,
  minWidth,
}: UseColumnDragSessionArgs<TData>) => {
  const [isResizing, setIsResizing] = useState(false);
  const setColumnSizingWithoutSync = useSetColumnSizingWithoutSync<TData>();
  const syncColumnsSizing = useSyncColumnsSizing();
  const endDragSessionRef = useRef<(() => void) | undefined>(undefined);

  const onMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // A new drag always supersedes any session still in flight
    endDragSessionRef.current?.();

    endDragSessionRef.current = startColumnResizeSession<TData>({
      clientX: event.clientX,
      columnKey,
      currentWidth,
      maxWidth,
      minWidth,
      onGestureEnd: () => setIsResizing(false),
      onSessionEnd: () => {
        endDragSessionRef.current = undefined;
      },
      setColumnWidth: setColumnSizingWithoutSync,
      syncColumnWidth: syncColumnsSizing,
    });

    setIsResizing(true);
  };

  // End any in-flight drag session on unmount
  useEffect(() => {
    return () => {
      endDragSessionRef.current?.();
    };
  }, []);

  return { isResizing, onMouseDown };
};
