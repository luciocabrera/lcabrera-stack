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
  const left = [...columnPinning.left];
  const right = [...columnPinning.right];

  const leftKeys = new Set<TKey>(left);
  const rightKeys = new Set<TKey>(right);

  if (side === 'left') {
    const keysBeforeOrAtIndex = allOrderedKeys.slice(0, index + 1);

    for (const key of keysBeforeOrAtIndex) {
      if (leftKeys.has(key)) continue;

      leftKeys.add(key);
      rightKeys.delete(key);
      left.push(key);
    }

    return { left, right: right.filter((key) => rightKeys.has(key)) };
  }

  const keysFromIndex = allOrderedKeys.slice(index);

  for (const key of keysFromIndex) {
    if (rightKeys.has(key)) continue;

    rightKeys.add(key);
    leftKeys.delete(key);
    right.push(key);
  }

  return { left: left.filter((key) => leftKeys.has(key)), right };
};
