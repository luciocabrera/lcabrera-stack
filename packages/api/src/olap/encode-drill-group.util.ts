import type { OlapDrillRequest, OlapGroupPathEntry } from './olap.types';

type EncodeDrillGroupArgs = OlapDrillRequest;

/**
 * The wire's own null, parsed rather than written as a literal because what is
 * needed is a *JSON* value: `undefined` is the one thing that cannot stand here,
 * for the reason `toWireEntry` gives.
 */
const WIRE_NULL: unknown = JSON.parse('null');

const toWireEntry = ({ columnKey, value }: OlapGroupPathEntry) => ({
  columnKey,
  value: value ?? WIRE_NULL,
});

/**
 * The `group` search-param value for a drill into one group row (ADR-079).
 * The parser is its other half and lives beside it (ADR-082): a drill request is encoded
 * in the browser and decoded on the server, and the two are behaviour rather than a shape
 * — nothing about a type would catch them drifting apart.
 */
export const encodeDrillGroup = ({
  group,
  groupKeys,
  periods,
}: EncodeDrillGroupArgs): string =>
  JSON.stringify({
    isSubtotal: group.isSubtotal,
    keys: groupKeys,
    path: group.path.map((entry) => toWireEntry(entry)),
    // Omitted when empty rather than written as `{}`, so an untruncated
    // grouping produces the param it produced before granularities existed.
    ...(periods !== undefined &&
      Object.keys(periods).length > 0 && { periods }),
  });
