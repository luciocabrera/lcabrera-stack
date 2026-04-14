type PinSide = 'left' | 'right';

type PinAllBetweenArgs<TKey extends string> = {
  readonly allOrderedKeys: readonly TKey[];
  readonly columnPinning: {
    readonly left: readonly TKey[];
    readonly right: readonly TKey[];
  };
  readonly index: number;
  readonly side: PinSide;
};

type PinAllBetweenResult<TKey extends string> = {
  readonly left: TKey[];
  readonly right: TKey[];
};

export const pinAllBetween = <TKey extends string>({
  allOrderedKeys,
  columnPinning,
  index,
  side,
}: PinAllBetweenArgs<TKey>): PinAllBetweenResult<TKey> => {
  const next = {
    left: [...columnPinning.left],
    right: [...columnPinning.right],
  };

  if (side === 'left') {
    for (const key of allOrderedKeys.slice(0, index + 1)) {
      if (!next.left.includes(key)) {
        next.right = next.right.filter((pinnedKey) => pinnedKey !== key);
        next.left.push(key);
      }
    }

    return next;
  }

  for (const key of allOrderedKeys.slice(index)) {
    if (!next.right.includes(key)) {
      next.left = next.left.filter((pinnedKey) => pinnedKey !== key);
      next.right.push(key);
    }
  }

  return next;
};
