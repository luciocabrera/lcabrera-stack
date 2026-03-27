import type { ColumnOrderState, ColumnPinningState } from "@/components/Table/Table.types";

import type { OrderConflictResolution } from "../ColumnOrderSection.types.ts";

type ResolvePinOrderConflictArgs = {
  readonly columnPinning: ColumnPinningState;
  readonly newOrder: ColumnOrderState;
  readonly resolution: OrderConflictResolution;
};

type ResolvePinOrderConflictResult = {
  readonly columnOrder: ColumnOrderState;
  readonly columnPinning: ColumnPinningState;
};

/**
 * Resolves a conflict between a new column order and the current pinning state.
 */
export const resolvePinOrderConflict = ({
  columnPinning,
  newOrder,
  resolution,
}: ResolvePinOrderConflictArgs): ResolvePinOrderConflictResult => {
  switch (resolution) {
    case "pin-to-match-order": {
      return pinToMatchOrder({ columnPinning, newOrder });
    }
    case "remove-conflicting-pins": {
      return removeConflictingPins({ columnPinning, newOrder });
    }
    case "reset-all-pins": {
      return {
        columnOrder: newOrder,
        columnPinning: { left: [], right: [] },
      };
    }
  }
};

/**
 * Keep only pins that are already contiguous at the edges in the new order.
 */
const removeConflictingPins = ({
  columnPinning,
  newOrder,
}: Omit<ResolvePinOrderConflictArgs, "resolution">): ResolvePinOrderConflictResult => {
  const validLeft: string[] = [];
  for (const key of newOrder) {
    if (columnPinning.left.includes(key)) {
      validLeft.push(key);
    } else {
      break;
    }
  }

  const validRight: string[] = [];
  for (const key of newOrder.toReversed()) {
    if (columnPinning.right.includes(key)) {
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

/**
 * Move pinned columns to the edges to keep all pins valid:
 * left-pinned to the start, right-pinned to the end, rest in the middle.
 */
const pinToMatchOrder = ({
  columnPinning,
  newOrder,
}: Omit<ResolvePinOrderConflictArgs, "resolution">): ResolvePinOrderConflictResult => {
  const leftPinned = newOrder.filter((key) => columnPinning.left.includes(key));
  const rightPinned = newOrder.filter((key) => columnPinning.right.includes(key));
  const middle = newOrder.filter(
    (key) => !columnPinning.left.includes(key) && !columnPinning.right.includes(key),
  );

  return {
    columnOrder: [...leftPinned, ...middle, ...rightPinned] as ColumnOrderState,
    columnPinning: {
      left: leftPinned,
      right: rightPinned,
    },
  };
};
