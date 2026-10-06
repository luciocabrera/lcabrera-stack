import type { SkillCatalogEntry } from './hashing.types.ts';

import { canonicalHash } from './canonicalHash.util.ts';
import { compareCodeUnits } from './compareCodeUnits.util.ts';

export const catalogHash = (entries: readonly SkillCatalogEntry[]) =>
  canonicalHash(
    entries.toSorted((left, right) =>
      compareCodeUnits(left.name ?? '', right.name ?? ''),
    ),
  );
