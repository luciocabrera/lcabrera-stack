type ExpandCubeSetsArgs = {
  readonly keys: readonly string[];
};

export const expandCubeSets = ({
  keys,
}: ExpandCubeSetsArgs): readonly (readonly string[])[] =>
  Array.from({ length: 2 ** keys.length }, (_, mask) =>
    keys.filter(
      (_key, index) => (mask & (2 ** (keys.length - 1 - index))) === 0,
    ),
  );
