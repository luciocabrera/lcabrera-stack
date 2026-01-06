import type { ReactNode } from 'react';

/**
 * Individual draggable item
 */
export type DraggableItem = {
  /** Content to render for this item */
  content: ReactNode;
  /** Unique identifier for the item */
  id: string;
};

/**
 * DraggableList component props
 */
export type DraggableListProps = {
  /** Array of draggable items */
  items: DraggableItem[];
  /** Callback when order changes */
  onOrderChange?: (items: DraggableItem[]) => void;
};

/**
 * Hook props for useDraggableList
 */
export type UseDraggableListProps = {
  /** Initial items array */
  initialItems: DraggableItem[];
  /** Callback when order changes */
  onOrderChange?: (items: DraggableItem[]) => void;
};
