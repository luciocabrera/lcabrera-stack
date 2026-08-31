import type { ReactNode } from 'react';

export type DraggableItem = {
  readonly content: ReactNode;
  /** Items sharing one value may not be split apart by a drop. */
  readonly groupId?: string;
  readonly id: string;
  readonly isDraggable?: boolean;
};

export type DraggableListProps = {
  readonly isBusy?: boolean;
  readonly items: readonly DraggableItem[];
  readonly onOrderChange?: (items: DraggableItem[]) => void;
};

export type UseDraggableListProps = {
  readonly initialItems: readonly DraggableItem[];
  readonly onOrderChange?: (items: DraggableItem[]) => void;
};
