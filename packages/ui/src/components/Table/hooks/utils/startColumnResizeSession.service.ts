import type { ColumnSizingArgs } from '#ui/components/Table/contexts/TableConfig/columns/actions/useSetColumnSizingWithoutSync.hook';
import type { DataKey } from '#ui/components/Table/Table.types';

import { startHorizontalDragSession } from '#ui/utils/dragSession/startHorizontalDragSession.service';

import { createResizeStartData } from './createResizeStartData.util';
import { resolveResizeWidth } from './resolveResizeWidth.util';

type StartColumnResizeSessionArgs<TData> = {
  readonly clientX: number;
  readonly columnKey: DataKey<TData>;
  readonly currentWidth: number | undefined;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly onGestureEnd: () => void;
  readonly onSessionEnd: () => void;
  readonly setColumnWidth: (args: ColumnSizingArgs<TData>) => void;
  readonly syncColumnWidth: () => void;
};

export const startColumnResizeSession = <TData>({
  clientX,
  columnKey,
  currentWidth,
  maxWidth,
  minWidth,
  onGestureEnd,
  onSessionEnd,
  setColumnWidth,
  syncColumnWidth,
}: StartColumnResizeSessionArgs<TData>) => {
  const startData = createResizeStartData({
    clientX,
    currentWidth,
    maxWidth,
    minWidth,
  });

  return startHorizontalDragSession({
    onCommit: syncColumnWidth,
    onGestureEnd,
    onSessionEnd,
    onWidth: (width: number) => {
      setColumnWidth({ columnKey, width });
    },
    resolveWidth: (pointerX: number) =>
      resolveResizeWidth({ clientX: pointerX, ...startData }),
  });
};
