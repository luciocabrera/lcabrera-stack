import type { RefObject } from 'react';

import type { DraggableItem } from '../DraggableList.types';

export type DraggableListItemProps = {
  /** Ref holding the id of the item currently being dragged (if any) */
  readonly dragItemId: RefObject<string | undefined>;
  readonly isBusy: boolean;
  readonly item: DraggableItem;
  readonly onDragEnd: () => void;
  readonly onDragEnter: (itemId: string) => void;
  readonly onDragStart: (itemId: string) => void;
};
