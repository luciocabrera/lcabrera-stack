import * as stylex from '@stylexjs/stylex';

import type { DraggableListProps } from './DraggableList.types';

import { busyStyles, styles } from './DraggableList.stylex';
import { useDraggableList } from './hooks';
import { handleDragOver } from './utils';

export const DraggableList = ({
  isBusy = false,
  items: initialItems,
  onOrderChange,
}: DraggableListProps) => {
  const { dragItemId, handleDragEnd, handleDragEnter, handleDragStart, items } =
    useDraggableList({
      initialItems,
      onOrderChange,
    });

  return (
    <ul {...stylex.props(styles.list)}>
      {items.map((item) => {
        const isDragging = dragItemId.current === item.id;

        const isDragOver =
          dragItemId.current !== undefined && dragItemId.current !== item.id;

        const canDrag = item.isDraggable !== false;
        const isDragEnabled = canDrag && !isBusy;

        return (
          <li
            key={item.id}
            {...stylex.props(
              styles.item,
              isDragging && styles.itemDragging,
              isDragOver && styles.itemDragOver,
              !canDrag && styles.itemNotDraggable,
            )}
            draggable={isDragEnabled}
            onDragEnd={isDragEnabled ? handleDragEnd : undefined}
            onDragEnter={
              isDragEnabled
                ? () => {
                    handleDragEnter(item.id);
                  }
                : undefined
            }
            onDragOver={isDragEnabled ? handleDragOver : undefined}
            onDragStart={
              isDragEnabled
                ? () => {
                    handleDragStart(item.id);
                  }
                : undefined
            }
          >
            {isBusy && (
              <div {...stylex.props(busyStyles.overlay)}>
                <div {...stylex.props(busyStyles.wave)} />
              </div>
            )}
            {canDrag && (
              <span
                {...stylex.props(styles.dragHandle)}
                aria-label='Drag handle'
              >
                ≡
              </span>
            )}
            <div {...stylex.props(styles.content)}>{item.content}</div>
          </li>
        );
      })}
    </ul>
  );
};
