type PinAllBetweenArgs<TKey extends string> = {
  readonly allOrderedKeys: readonly TKey[];
  readonly columnPinning: {
    readonly left: readonly TKey[];
    readonly right: readonly TKey[];
  };
  readonly index: number;
  readonly side: PinSide;
};

type PinSide = 'left' | 'right';

export const pinAllBetween = <TKey extends string>({
  allOrderedKeys,
  columnPinning,
  index,
  side,
}: PinAllBetweenArgs<TKey>) => {
  const next = {
    left: [...columnPinning.left],
    right: [...columnPinning.right],
  };

  if (side === 'left') {
    const keysBeforeOrAtIndex = allOrderedKeys.slice(0, index + 1);

    for (const key of keysBeforeOrAtIndex) {
      if (next.left.includes(key)) continue;

      next.right = next.right.filter((pinnedKey) => pinnedKey !== key);
      next.left.push(key);
    }

    return next;
  }

  const keysFromIndex = allOrderedKeys.slice(index);

  for (const key of keysFromIndex) {
    if (next.right.includes(key)) continue;

    next.left = next.left.filter((pinnedKey) => pinnedKey !== key);
    next.right.push(key);
  }

  return next;
};
