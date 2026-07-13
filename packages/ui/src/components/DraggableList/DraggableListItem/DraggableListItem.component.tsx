import * as stylex from '@stylexjs/stylex';

import type { DraggableListItemProps } from './DraggableListItem.types';

import { busyStyles, styles } from './DraggableListItem.stylex';
import { handleDragOver } from './utils';

/**
 * Single draggable row: derives its own drag state (`isDragging`,
 * `isDragOver`, `isDragEnabled`) and owns the `<li>` with the drag event
 * wiring, busy shimmer overlay, and drag handle. Private delegate of
 * `DraggableList` — not exported from the barrel.
 */
export const DraggableListItem = ({
  dragItemId,
  isBusy,
  item,
  onDragEnd,
  onDragEnter,
  onDragStart,
}: DraggableListItemProps) => {
  const isDragging = dragItemId.current === item.id;

  const isDragOver =
    dragItemId.current !== undefined && dragItemId.current !== item.id;

  const canDrag = item.isDraggable !== false;
  const isDragEnabled = canDrag && !isBusy;

  const handleDragEnter = () => {
    onDragEnter(item.id);
  };

  const handleDragStart = () => {
    onDragStart(item.id);
  };

  return (
    <li
      {...stylex.props(
        styles.item,
        isDragging && styles.itemDragging,
        isDragOver && styles.itemDragOver,
        !canDrag && styles.itemNotDraggable,
      )}
      draggable={isDragEnabled}
      onDragEnd={isDragEnabled ? onDragEnd : undefined}
      onDragEnter={isDragEnabled ? handleDragEnter : undefined}
      onDragOver={isDragEnabled ? handleDragOver : undefined}
      onDragStart={isDragEnabled ? handleDragStart : undefined}
    >
      {isBusy && (
        <div {...stylex.props(busyStyles.overlay)}>
          <div {...stylex.props(busyStyles.wave)} />
        </div>
      )}
      {canDrag && (
        <span {...stylex.props(styles.dragHandle)} aria-label='Drag handle'>
          ≡
        </span>
      )}
      <div {...stylex.props(styles.content)}>{item.content}</div>
    </li>
  );
};
