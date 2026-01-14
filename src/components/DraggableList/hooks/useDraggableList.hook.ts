import { useEffect, useRef, useState } from 'react';

import type {
  DraggableItem,
  UseDraggableListProps,
} from '../DraggableList.types';

/**
 * Hook for managing draggable list state with native HTML5 drag and drop
 */
export const useDraggableList = ({
  initialItems,
  onOrderChange,
}: UseDraggableListProps) => {
  const [items, setItems] = useState<DraggableItem[]>(initialItems);
  const dragItemId = useRef<string | undefined>(undefined);
  const dragOverItemId = useRef<string | undefined>(undefined);

  // Sync local state with prop changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleDragStart = (id: string) => {
    dragItemId.current = id;
  };

  const handleDragEnter = (id: string) => {
    dragOverItemId.current = id;
  };

  const handleDragEnd = () => {
    const fromId = dragItemId.current;
    const toId = dragOverItemId.current;

    if (!fromId || !toId || fromId === toId) {
      dragItemId.current = undefined;
      dragOverItemId.current = undefined;
      return;
    }

    const fromIndex = items.findIndex((item) => item.id === fromId);

    const toIndex = items.findIndex((item) => item.id === toId);

    if (fromIndex === -1 || toIndex === -1) {
      dragItemId.current = undefined;
      dragOverItemId.current = undefined;
      return;
    }

    const updatedItems = [...items];

    const [movedItem] = updatedItems.splice(fromIndex, 1);

    if (!movedItem) {
      dragItemId.current = undefined;
      dragOverItemId.current = undefined;
      return;
    }

    updatedItems.splice(toIndex, 0, movedItem);

    setItems(updatedItems);

    if (onOrderChange) {
      onOrderChange(updatedItems);
    }

    dragItemId.current = undefined;
    dragOverItemId.current = undefined;
  };

  return {
    dragItemId,
    handleDragEnd,
    handleDragEnter,
    handleDragStart,
    items,
  };
};
