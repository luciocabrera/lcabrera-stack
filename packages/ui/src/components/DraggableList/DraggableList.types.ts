import type { ReactNode } from 'react';

export type DraggableItem = {
  readonly content: ReactNode;
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
