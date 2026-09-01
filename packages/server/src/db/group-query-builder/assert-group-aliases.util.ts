import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';
import { MAX_IDENTIFIER_LENGTH } from './group-query-builder.constants.ts';

type AssertGroupAliasesArgs = {
  readonly aliases: readonly string[];
  readonly allowedColumns: readonly string[];
};

export const assertGroupAliases = ({
  aliases,
  allowedColumns,
}: AssertGroupAliasesArgs) => {
  const seen = new Set<string>();

  for (const alias of aliases) {
    assertSafeIdentifier(alias);

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
