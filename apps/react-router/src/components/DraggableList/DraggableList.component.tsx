import * as stylex from '@stylexjs/stylex';

import type { DraggableListProps } from './DraggableList.types';

import { styles } from './DraggableList.stylex';
import { useDraggableList } from './hooks';
import { handleDragOver } from './utils';

export const DraggableList = ({
  items: initialItems,
  onOrderChange,
}: DraggableListProps) => {
  const { dragItemId, handleDragEnd, handleDragEnter, handleDragStart, items } =
    useDraggableList({
      initialItems,
      onOrderChange,
    });

  return (
    <ul {...stylex.props(styles.list)} role='list'>
      {items.map((item) => {
        const isDragging = dragItemId.current === item.id;

        const isDragOver =
          dragItemId.current !== undefined && dragItemId.current !== item.id;

        const canDrag = item.isDraggable !== false;

        return (
          <li
            key={item.id}
            {...stylex.props(
              styles.item,
              isDragging && styles.itemDragging,
              isDragOver && styles.itemDragOver,
              !canDrag && styles.itemNotDraggable,
            )}
            draggable={canDrag}
            onDragEnd={canDrag ? handleDragEnd : undefined}
            onDragEnter={() => {
              handleDragEnter(item.id);
            }}
            onDragOver={handleDragOver}
            onDragStart={
              canDrag
                ? () => {
                    handleDragStart(item.id);
                  }
                : undefined
            }
            role='option'
            tabIndex={0}
          >
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
