import type { PinSide } from './getPinnedEntries.util';

type ResolveClosestSideArgs = {
  readonly distanceFromLeft: number;
  readonly distanceFromRight: number;
  readonly originalSide: PinSide;
};

export const resolveClosestSide = ({
  distanceFromLeft,
  distanceFromRight,
  originalSide,
}: ResolveClosestSideArgs) => {
  if (distanceFromLeft < distanceFromRight) {
    return 'left';
  }

  return distanceFromRight < distanceFromLeft ? 'right' : originalSide;
};
