import type { TableMetaState } from '#ui/components/Table/Table.types';

type ResolveTableCapabilityMetaArgs = {
  readonly meta?: Partial<TableMetaState>;
};

type TableCapabilityKey =
  | 'isGroupingEnabled'
  | 'isGroupingLocked'
  | 'isKeysetEnabled'
  | 'isServerFilterEnabled';

export const resolveTableCapabilityMeta = ({
  meta,
}: ResolveTableCapabilityMetaArgs) =>
  ({
    isGroupingEnabled: meta?.isGroupingEnabled === true,
    isGroupingLocked: meta?.isGroupingLocked === true,
    isKeysetEnabled: meta?.isKeysetEnabled === true,
    isServerFilterEnabled: meta?.isServerFilterEnabled === true,
  }) satisfies Record<TableCapabilityKey, boolean>;
