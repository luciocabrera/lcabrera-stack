import type { GroupingMode } from './group-query-builder.types.ts';

import { expandCubeSets } from './expand-cube-sets.util.ts';

type ExpandGroupingSetsArgs = {
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

export const expandGroupingSets = ({
  grouping,
  keys,
}: ExpandGroupingSetsArgs): readonly (readonly string[])[] => {
  const setsByMode: Readonly<
    Record<GroupingMode, () => readonly (readonly string[])[]>
  > = {
    cube: () => expandCubeSets({ keys }),
    flat: () => [[...keys]],
    rollup: () =>
      Array.from({ length: keys.length + 1 }, (_, dropped) =>
        keys.slice(0, keys.length - dropped),
      ),
  };

  return setsByMode[grouping]();
};
