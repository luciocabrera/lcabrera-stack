import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { assertColumnAllowed } from '../query-builder/assert-column-allowed.util.ts';
import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';
import { MAX_GROUP_KEYS } from './group-query-builder.constants.ts';

type AssertGroupKeysArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly keys: readonly string[];
};

/**
 * Every reason a set of group keys can be refused, checked before anything is
 * emitted and before any round trip — depth is pure, so a request past the cap
 * never costs a catalogue query.
 *
 * The capability lookup is what enforces ADR-058 from inside a pure function:
 * a column the catalogue refused is refused here with the catalogue's own
 * reason, rather than being re-litigated against a type vocabulary that cannot
 * tell `point` from `text`.
 */
export const assertGroupKeys = ({
  allowedColumns,
  capabilities,
  keys,
}: AssertGroupKeysArgs): void => {
  if (keys.length === 0) {
    throw new Error('A grouped query needs at least one group key.');
  }

  if (keys.length > MAX_GROUP_KEYS) {
    throw new Error(
      `A grouped query takes at most ${MAX_GROUP_KEYS} group keys; got ${keys.length}.`,
    );
  }

  if (new Set(keys).size !== keys.length) {
    throw new Error(`Group keys must be distinct; got "${keys.join('", "')}".`);
  }

  for (const key of keys) {
    assertSafeIdentifier(key);
    assertColumnAllowed({ allowedColumns, column: key });

    const capability = capabilities[key];

    if (capability === undefined) {
      throw new Error(
        `No grouping capability was resolved for column "${key}"; it is not a column of this table, or the catalogue could not see it.`,
      );
    }

    if (!capability.canGroup) {
      throw new Error(
        `Column "${key}" is not a legal group key: ${capability.refusal}.`,
      );
    }
  }
};
