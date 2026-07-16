import * as stylex from '@stylexjs/stylex';

import type { DraggableListProps } from './DraggableList.types';

import { styles } from './DraggableList.stylex';
import { DraggableListItem } from './DraggableListItem/DraggableListItem.component';
import { useDraggableList } from './hooks';

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
      {items.map((item) => (
        <DraggableListItem
          dragItemId={dragItemId}
          isBusy={isBusy}
          item={item}
          key={item.id}
          onDragEnd={handleDragEnd}
          onDragEnter={handleDragEnter}
          onDragStart={handleDragStart}
        />
      ))}
    </ul>
  );
};
