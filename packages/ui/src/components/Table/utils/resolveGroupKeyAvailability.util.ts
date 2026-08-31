import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { resolveColumnCapabilities } from './resolveColumnCapabilities.util';

type ResolveGroupKeyAvailabilityArgs<TData> = {
  readonly capability: TableColumnGroupingCapability | undefined;
  readonly column: TableColumn<TData> | undefined;
};

export const resolveGroupKeyAvailability = <TData>({
  capability,
  column,
}: ResolveGroupKeyAvailabilityArgs<TData>) => {
  const { isGroupable } = resolveColumnCapabilities(column);

  if (!isGroupable) {
    return {
      isGroupable: false,
      refusal: undefined,
      requiredPeriod: undefined,
    };
  }

  if (capability?.canGroup !== false) {
    return { isGroupable: true, refusal: undefined, requiredPeriod: undefined };
  }

  const [finest] = capability.periods;

  return finest === undefined
    ? {
        isGroupable: false,
        refusal: capability.refusal,
        requiredPeriod: undefined,
      }
    : { isGroupable: true, refusal: undefined, requiredPeriod: finest };
};
