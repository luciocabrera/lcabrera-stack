import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertColumnAllowed } from '../query-builder/assert-column-allowed.util.ts';
import { assertSafeIdentifier } from '../query-builder/assert-safe-identifier.util.ts';
import { assertGroupDepth } from './assert-group-depth.util.ts';

type AssertGroupKeysArgs = {
  readonly allowedColumns: readonly string[];
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly keys: readonly string[];
};

/**
 * Every reason a set of group keys can be refused, checked before anything is
 * emitted.
 *
 * The depth half is delegated to `assertGroupDepth`, which needs no capability
 * map — and that is what lets the executor run it *before any round trip*, so a
 * request past the cap never costs a catalogue query (ADR-066). The builder
 * still runs it too: the pre-flight check is an earlier gate, never the only one.
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
  assertGroupDepth({ keys });

  for (const key of keys) {
    assertSafeIdentifier(key);
    assertColumnAllowed({ allowedColumns, column: key });

    const capability = capabilities[key];

    if (capability === undefined) {
      throw new GroupingRefusedError({
        column: key,
        message: `No grouping capability was resolved for column "${key}"; it is not a column of this table, or the catalogue could not see it.`,
        reason: 'unknown-column',
      });
    }

    if (!capability.canGroup) {
      throw new GroupingRefusedError({
        column: key,
        message: `Column "${key}" is not a legal group key: ${capability.refusal}.`,
        reason: 'column-not-groupable',
      });
    }
  }
};
