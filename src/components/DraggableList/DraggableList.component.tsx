import type { DragEvent } from 'react';

import * as stylex from '@stylexjs/stylex';

import type { DraggableListProps } from './DraggableList.types';

import { styles } from './DraggableList.stylex';
import { useDraggableList } from './hooks';

const handleDragOver = (event: DragEvent<HTMLLIElement>) => {
  event.preventDefault();
};

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

        return (
          <li
            key={item.id}
            {...stylex.props(
              styles.item,
              isDragging && styles.item_dragging,
              isDragOver && styles.item_dragOver,
            )}
            draggable
            onDragEnd={handleDragEnd}
            onDragEnter={() => {
              handleDragEnter(item.id);
            }}
            onDragOver={handleDragOver}
            onDragStart={() => {
              handleDragStart(item.id);
            }}
            role='option'
            tabIndex={0}
          >
            <span {...stylex.props(styles.dragHandle)} aria-label='Drag handle'>
              ≡
            </span>
            <div {...stylex.props(styles.content)}>{item.content}</div>
          </li>
        );
      })}
    </ul>
  );
};
