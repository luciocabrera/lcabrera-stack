import { useRef, useState } from 'react';

import type {
  DraggableItem,
  UseDraggableListProps,
} from '../DraggableList.types';

import { countFragmentedGroups } from '../utils';

export const useDraggableList = ({
  initialItems,
  onOrderChange,
}: UseDraggableListProps) => {
  const [items, setItems] = useState<DraggableItem[]>([...initialItems]);
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  const dragItemId = useRef<string | undefined>(undefined);
  const dragOverItemId = useRef<string | undefined>(undefined);

  if (prevInitialItems !== initialItems) {
    setPrevInitialItems(initialItems);
    setItems([...initialItems]);
  }

  const handleDragStart = (id: string) => {
    dragItemId.current = id;
  };

  const handleDragEnter = (id: string) => {
    dragOverItemId.current = id;
  };

  const handleDragEnd = () => {
    const fromId = dragItemId.current;
    const toId = dragOverItemId.current;
    const fromIndex = items.findIndex((item) => item.id === fromId);
    const toIndex = items.findIndex((item) => item.id === toId);
    const updatedItems = [...items];

    const [movedItem] = updatedItems.splice(fromIndex, 1);

    if (!fromId || !toId || fromId === toId) {
      dragItemId.current = undefined;
      dragOverItemId.current = undefined;
      return;
    }

    if (fromIndex === -1 || toIndex === -1) {
      dragItemId.current = undefined;
      dragOverItemId.current = undefined;
      return;
    }

    if (!movedItem) {
      dragItemId.current = undefined;
      dragOverItemId.current = undefined;
      return;
    }

    updatedItems.splice(toIndex, 0, movedItem);

    if (countFragmentedGroups(updatedItems) > countFragmentedGroups(items)) {
      dragItemId.current = undefined;
      dragOverItemId.current = undefined;
      return;
    }

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
