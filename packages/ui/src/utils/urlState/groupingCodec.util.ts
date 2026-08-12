import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { CompactGrouping } from './urlState.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';

/** What `deserialize` answers for anything it refuses: no grouping at all. */
const NO_GROUPING: CompactGrouping = { keys: [] };

/**
 * Accepts `{"keys":["order_status"]}` and nothing else — one member, named
 * `keys`, holding an array of strings. A second member, a missing one, a
 * misspelling, or one non-string element refuses the **whole** payload.
 *
 * Refusing whole is the point (ADR-061): grouping changes the SQL a route
 * emits, so a partly-accepted key list would run a query nobody asked for while
 * the URL still reads as the one that was shared. A flat table is the honest
 * answer to a param that cannot be read.
 *
 * The single-member check is what makes `__proto__` a non-issue without
 * `Object.fromEntries`: `JSON.parse` gives it as an own property, so a payload
 * carrying one has two entries and is refused, and a payload carrying only one
 * is refused for not being named `keys`. The accepted shape is rebuilt as an
 * object literal with a fixed key, which reaches no prototype setter.
 */
const narrowCompactGrouping = (parsed: unknown) => {
  if (!isObject(parsed) || Array.isArray(parsed)) {
    return;
  }

  const entries = Object.entries(parsed);
  const [entry] = entries;

  if (entry?.[0] !== 'keys' || entries.length !== 1) {
    return;
  }

  const [, value] = entry;

  if (
    !Array.isArray(value) ||
    value.some((key: unknown) => typeof key !== 'string')
  ) {
    return;
  }

  return { keys: [...value] } satisfies CompactGrouping;
};

/** Codec for the compact `grouping` search param. */
export const groupingCodec = createUrlStateCodec<CompactGrouping>({
  compact: (state) => state,
  fallback: NO_GROUPING,
  label: 'grouping',
  narrow: narrowCompactGrouping,
});
