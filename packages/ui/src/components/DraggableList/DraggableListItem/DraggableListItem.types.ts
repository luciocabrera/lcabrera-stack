import type { RefObject } from 'react';

import type { DraggableItem } from '../DraggableList.types';

export type DraggableListItemProps = {
  readonly dragItemId: RefObject<string | undefined>;
  readonly isBusy: boolean;
  readonly item: DraggableItem;
  readonly onDragEnd: () => void;
  readonly onDragEnter: (itemId: string) => void;
  readonly onDragStart: (itemId: string) => void;
};
