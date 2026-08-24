import type {
  ColumnOrderState,
  ColumnPinningState,
} from '#ui/components/Table/Table.types';

import type { OrderConflictResolution } from '../ColumnOrderSection.types';

type ResolvePinOrderConflictArgs = {
  readonly columnPinning: ColumnPinningState;
  readonly newOrder: ColumnOrderState;
  readonly resolution: OrderConflictResolution;
};

export const resolvePinOrderConflict = ({
  columnPinning,
  newOrder,
  resolution,
}: ResolvePinOrderConflictArgs) => {
  switch (resolution) {
    case 'pin-to-match-order': {
      return pinToMatchOrder({ columnPinning, newOrder });
    }
    case 'remove-conflicting-pins': {
      return removeConflictingPins({ columnPinning, newOrder });
    }
    case 'reset-all-pins': {
      return {
        columnOrder: newOrder,
        columnPinning: { left: [], right: [] },
      };
    }
  }
};

const removeConflictingPins = ({
  columnPinning,
  newOrder,
}: Omit<ResolvePinOrderConflictArgs, 'resolution'>) => {
  const leftPinned = new Set<string>(columnPinning.left);
  const rightPinned = new Set<string>(columnPinning.right);

  const validLeft: string[] = [];
  for (const key of newOrder) {
    if (leftPinned.has(key)) {
      validLeft.push(key);
    } else {
      break;
    }
  }

  const validRight: string[] = [];
  for (const key of newOrder.toReversed()) {
    if (rightPinned.has(key)) {
      validRight.unshift(key);
    } else {
      break;
    }
  }

  return {
    columnOrder: newOrder,
    columnPinning: { left: validLeft, right: validRight },
  };
};

const pinToMatchOrder = ({
  columnPinning,
  newOrder,
}: Omit<ResolvePinOrderConflictArgs, 'resolution'>) => {
  // Local Sets rather than `splitColumnsByPinning`: that helper partitions
  // `TableColumn[]`, and this partitions the key list itself. Reaching for it
  // would mean widening its published return shape to serve one caller.
  const leftPinnedKeys = new Set<string>(columnPinning.left);
  const rightPinnedKeys = new Set<string>(columnPinning.right);

  const leftPinned = newOrder.filter((key) => leftPinnedKeys.has(key));
  const rightPinned = newOrder.filter((key) => rightPinnedKeys.has(key));
  const middle = newOrder.filter(
    (key) => !leftPinnedKeys.has(key) && !rightPinnedKeys.has(key),
  );

  return {
    columnOrder: [...leftPinned, ...middle, ...rightPinned] as ColumnOrderState,
    columnPinning: {
      left: leftPinned,
      right: rightPinned,
    },
  };
};
