import type { TableMetaState } from '#ui/components/Table/Table.types';

type ResolveTableCapabilityMetaArgs = {
  readonly meta?: Partial<TableMetaState>;
};

/**
 * The `TableMetaState` fields that decide what the server is asked for, as
 * opposed to how the table looks. Naming them as a union is what makes the
 * resolve below total: adding a capability here is a compile error until it is
 * resolved from `meta`, so a new flag cannot silently inherit the behaviour
 * this util exists to prevent.
 */
type TableCapabilityKey =
  | 'isGroupingEnabled'
  | 'isKeysetEnabled'
  | 'isServerFilterEnabled';

/**
 * Resolve a route's request-shaping capabilities from its loader `meta` alone.
 *
 * A capability decides what the server is asked for, so it may come only from
 * the route's own declaration (ADR-063). The loader's other meta source is the
 * persisted UI-flags cookie, which is client-controlled and validated nowhere
 * on the way in — `parseVersionedPayload` casts rather than parses, and the
 * persist-cookie action writes the entries it is handed. Spreading this result
 * last means absent still means off no matter what that cookie carries, which
 * is the property ADR-056 §4 defaulted these flags off to guarantee: sending a
 * `filter` to an endpoint that ignores it appends unfiltered rows to a filtered
 * table.
 *
 * Every key is returned unconditionally, so the resolve cannot leave a hole for
 * an earlier spread to fill.
 */
export const resolveTableCapabilityMeta = ({
  meta,
}: ResolveTableCapabilityMetaArgs) =>
  ({
    isGroupingEnabled: meta?.isGroupingEnabled === true,
    isKeysetEnabled: meta?.isKeysetEnabled === true,
    isServerFilterEnabled: meta?.isServerFilterEnabled === true,
  }) satisfies Record<TableCapabilityKey, boolean>;
