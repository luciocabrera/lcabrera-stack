import type { OlapDrillRequest, OlapGroupPathEntry } from './olap.types';

type EncodeDrillGroupArgs = OlapDrillRequest;

/**
 * The wire's own null, parsed rather than written as a literal because what is
 * needed is a *JSON* value: `undefined` is the one thing that cannot stand here,
 * for the reason `toWireEntry` gives.
 */
const WIRE_NULL: unknown = JSON.parse('null');

/**
 * One path entry as it goes on the wire — and the place `undefined` is turned
 * into a null, because only one of them survives JSON.
 *
 * `JSON.stringify` **drops** an object member whose value is `undefined` rather
 * than writing it, so an unnormalised entry crosses as `{"columnKey":"city"}`.
 * The parser separates a NULL key from a malformed entry by whether `value` is
 * present, so it would then refuse the whole request — and the NULL group is
 * exactly the one a reader is most likely to click, making this fail on the
 * most-clicked case and look like a server bug.
 *
 * `label` is dropped here rather than filtered later: a formatted display string
 * has no business reaching a query.
 */
const toWireEntry = ({ columnKey, value }: OlapGroupPathEntry) => ({
  columnKey,
  value: value ?? WIRE_NULL,
});

/**
 * The `group` search-param value for a drill into one group row (ADR-079).
 *
 * The parser is its other half and lives beside it (ADR-082): a drill request is
 * encoded in the browser and decoded on the server, and the two are behaviour
 * rather than a shape — nothing about a type would catch them drifting apart.
 * `drill-group-codec.test.ts` is what asserts they have not.
 */
export const encodeDrillGroup = ({
  group,
  groupKeys,
}: EncodeDrillGroupArgs): string =>
  JSON.stringify({
    isSubtotal: group.isSubtotal,
    keys: groupKeys,
    path: group.path.map((entry) => toWireEntry(entry)),
  });
