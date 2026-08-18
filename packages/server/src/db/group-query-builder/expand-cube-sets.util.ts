type ExpandCubeSetsArgs = {
  readonly keys: readonly string[];
};

/**
 * Every subset of `keys`, in the order `CUBE(k₁, …, kₙ)` emits them.
 *
 * The order is not a convention chosen here — it is **ascending `GROUPING()`
 * mask**. Bit `n-1-i` of the mask is 1 when `keys[i]` is absent
 * (`to-grouping-set-mask.util.ts`), so counting 0 → 2ⁿ-1 walks from the full key
 * list down to the grand total, dropping the *last* key fastest. That is exactly
 * the sequence the PostgreSQL manual lists for `CUBE`, and it is the same count
 * rollup's masks (0, 1, 3, …, 2ⁿ-1) are a subsequence of — so all three modes
 * emit in one order and nothing downstream needs a per-mode case.
 *
 * The subsets are a **lattice, not a tree**: `(b)` is a child of no `(a)`. Only
 * the expansion is shared with rollup; the shape of the result is not.
 */
export const expandCubeSets = ({
  keys,
}: ExpandCubeSetsArgs): readonly (readonly string[])[] =>
  Array.from({ length: 2 ** keys.length }, (_, mask) =>
    keys.filter(
      (_key, index) => (mask & (2 ** (keys.length - 1 - index))) === 0,
    ),
  );
