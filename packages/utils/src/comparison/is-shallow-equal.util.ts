type IsShallowEqualArgs<T extends Record<string, unknown>> = {
  readonly objA?: T;
  readonly objB?: T;
};

export const isShallowEqual = <T extends Record<string, unknown>>({
  objA,
  objB,
}: IsShallowEqualArgs<T>) => {
  if (objA === objB) return true;
  if (!objA || !objB) return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.hasOwn(objB, key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
};
