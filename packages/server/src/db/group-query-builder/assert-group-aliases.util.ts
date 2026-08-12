import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';
import { MAX_IDENTIFIER_LENGTH } from './group-query-builder.constants.ts';

type AssertGroupAliasesArgs = {
  /** Every alias the SELECT list will project, the mask's included. */
  readonly aliases: readonly string[];
  readonly allowedColumns: readonly string[];
};

/**
 * The projection's alias rules, all of which exist because Postgres fails them
 * quietly.
 *
 * **Length.** Postgres truncates an identifier past its limit with only a
 * `NOTICE`, and `pg` then returns one row object in which the second of two
 * truncation-equal aliases has overwritten the first — the first column is not
 * mangled, it is gone. Refusing is the only outcome a caller can act on; the
 * escape hatch is an explicit shorter `alias` on the aggregate.
 *
 * **Collision with a real column.** `group_mask` and `count_rows` are fixed
 * names, so a table that already has one would produce a duplicate output
 * column with the same silent overwrite.
 *
 * Group keys need no separate check: they are members of `allowedColumns`,
 * which `assertGroupKeys` has already established.
 */
export const assertGroupAliases = ({
  aliases,
  allowedColumns,
}: AssertGroupAliasesArgs): void => {
  const seen = new Set<string>();

  for (const alias of aliases) {
    assertSafeIdentifier(alias);

    // `assertSafeIdentifier` admits ASCII only, so character length is byte
    // length — which is what Postgres counts.
    if (alias.length > MAX_IDENTIFIER_LENGTH) {
      throw new Error(
        `Alias "${alias}" is longer than Postgres's ${MAX_IDENTIFIER_LENGTH}-character identifier limit and would be truncated; pass a shorter explicit alias.`,
      );
    }

    if (allowedColumns.includes(alias)) {
      throw new Error(
        `Alias "${alias}" collides with a real column of this table.`,
      );
    }

    if (seen.has(alias)) {
      throw new Error(`Alias "${alias}" is projected more than once.`);
    }

    seen.add(alias);
  }
};
