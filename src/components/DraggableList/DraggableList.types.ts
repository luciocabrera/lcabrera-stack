import type { ReactNode } from 'react';

/**
 * Individual draggable item
 */
export type DraggableItem = {
  /** Content to render for this item */
  readonly content: ReactNode;
  /** Unique identifier for the item */
  readonly id: string;
  /** Whether this item can be dragged (default: true) */
  readonly isDraggable?: boolean;
};

/**
 * DraggableList component props
 */
export type DraggableListProps = {
  /** Array of draggable items */
  readonly items: DraggableItem[];
  /** Callback when order changes */
  readonly onOrderChange?: (items: DraggableItem[]) => void;
};

/**
 * Hook props for useDraggableList
 */
export type UseDraggableListProps = {
  /** Initial items array */
  readonly initialItems: DraggableItem[];
  /** Callback when order changes */
  readonly onOrderChange?: (items: DraggableItem[]) => void;
};
