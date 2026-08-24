import { useEffect, useRef, useState } from 'react';

import type { DataKey } from '#ui/components/Table/Table.types';

import {
  useSetColumnSizingWithoutSync,
  useSyncColumnsSizing,
} from '#ui/components/Table/contexts/TableConfig/columns/actions';

import { startColumnResizeSession } from './utils/startColumnResizeSession.service';

type UseColumnDragSessionArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

/** Unmount ends any in-flight session through `endDragSessionRef`. */
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
