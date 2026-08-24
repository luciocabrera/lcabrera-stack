import type { TableMetaState } from '#ui/components/Table/Table.types';

type ResolveTableCapabilityMetaArgs = {
  readonly meta?: Partial<TableMetaState>;
};

/**
 * Naming them as a union is what makes the resolve below total: adding a capability here
 * is a compile error until it is resolved from `meta`, so a new flag cannot silently
 * inherit the behaviour this util exists to prevent.
 */
type TableCapabilityKey =
  | 'isGroupingEnabled'
  | 'isGroupingLocked'
  | 'isKeysetEnabled'
  | 'isServerFilterEnabled';

/**
 * A capability decides what the server is asked for, so it may come only from the route's
 * own declaration (ADR-063).
 * Spreading this result last means absent still means off no matter what that cookie
 * carries, which is the property ADR-056 §4 defaulted these flags off to guarantee:
 * sending a `filter` to an endpoint that ignores it appends unfiltered rows to a filtered
 * table.
 */
export const resolveTableCapabilityMeta = ({
  meta,
}: ResolveTableCapabilityMetaArgs) =>
  ({
    isGroupingEnabled: meta?.isGroupingEnabled === true,
    isGroupingLocked: meta?.isGroupingLocked === true,
    isKeysetEnabled: meta?.isKeysetEnabled === true,
    isServerFilterEnabled: meta?.isServerFilterEnabled === true,
  }) satisfies Record<TableCapabilityKey, boolean>;
