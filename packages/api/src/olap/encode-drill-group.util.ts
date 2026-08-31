import type { OlapDrillRequest, OlapGroupPathEntry } from './olap.types';

type EncodeDrillGroupArgs = OlapDrillRequest;

const WIRE_NULL: unknown = JSON.parse('null');

const toWireEntry = ({ columnKey, value }: OlapGroupPathEntry) => ({
  columnKey,
  value: value ?? WIRE_NULL,
});

export const encodeDrillGroup = ({
  group,
  groupKeys,
  periods,
}: EncodeDrillGroupArgs): string =>
  JSON.stringify({
    isSubtotal: group.isSubtotal,
    keys: groupKeys,
    path: group.path.map((entry) => toWireEntry(entry)),
    ...(periods !== undefined &&
      Object.keys(periods).length > 0 && { periods }),
  });
