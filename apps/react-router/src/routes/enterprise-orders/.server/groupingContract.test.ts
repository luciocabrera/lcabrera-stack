import type {
  AggregateFn,
  ColumnAnalyticalRole,
  ColumnGroupingCapability,
  GroupKeyRefusalReason,
} from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type {
  TableAggregateFn,
  TableColumnAnalyticalRole,
  TableColumnGroupingCapability,
  TableGroupKeyRefusalReason,
} from '@lcabrera/ui/components/Table/Table.types';

import { MAX_GROUP_KEYS } from '@lcabrera/server/db/group-query-builder/group-query-builder.constants';
import {
  MAX_TABLE_GROUP_KEYS,
  TABLE_AGGREGATE_FNS,
} from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

/**
 * `@lcabrera/ui` and `@lcabrera/server` each declare the grouping vocabulary and
 * the group-key depth cap independently — `@lcabrera/ui` is client-safe and may
 * not depend on the Node-only server package (ADR-038), so neither can import
 * the other's definition (ADR-039). This is the guard that keeps the two in
 * step, and it is the same shape as the column-filter contract beside it.
 *
 * It lives in the app because the app is the only thing that legitimately
 * depends on both packages — integrating them is precisely what it is for, and
 * in `.server/` because it imports a **runtime value** from `@lcabrera/server/db`
 * rather than a type. Its sibling `filterContract.test.ts` sits at the route
 * root because `filters/` is not under that restriction.
 *
 * **Two kinds of assertion, and the difference matters.** The depth cap is a
 * runtime value, so a plain `expect` catches drift. The three unions are types,
 * so the guard is the *assignment* below: each is annotated with the other
 * package's union in both directions, and the file only compiles while every
 * member of each is a member of the other. Adding `median` to one side alone
 * fails `vp run typecheck` here, naming the contract. Verified by planting the
 * drift in both directions and confirming the failure before trusting it.
 *
 * The annotations are deliberately **not** `satisfies`: `satisfies` keeps the
 * narrow literal type, so the check would only ever cover the members written
 * here. A widening annotation checks the whole union against the whole of the
 * other package's — the same trap `filterContract.test.ts` documents.
 */

/** UI → server. Fails to compile if the UI union gains a member the server lacks. */
const serverAggregates: readonly AggregateFn[] = TABLE_AGGREGATE_FNS;

/** server → UI, closing the other direction. */
const uiAggregates: readonly TableAggregateFn[] = serverAggregates;

/** The role vocabulary, both directions. */
const uiRoles: readonly TableColumnAnalyticalRole[] = [
  'dimension',
  'fact',
  'unsupported',
];
const serverRoles: readonly ColumnAnalyticalRole[] = uiRoles;
const backToUiRoles: readonly TableColumnAnalyticalRole[] = serverRoles;

/** The refusal vocabulary, both directions. */
const uiRefusals: readonly TableGroupKeyRefusalReason[] = [
  'no-equality-operator',
  'not-a-dimension',
  'stats-unavailable',
  'too-many-distinct',
  'unique-ish',
];
const serverRefusals: readonly GroupKeyRefusalReason[] = uiRefusals;
const backToUiRefusals: readonly TableGroupKeyRefusalReason[] = serverRefusals;

/**
 * The whole capability object, both directions. This is what the loader ships
 * to the client (ADR-063), so the two declarations have to agree member for
 * member — including the discriminated `canGroup`/`refusal` pair, which is what
 * makes a refusal unable to arrive without its reason.
 */
const serverCapability: ColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct'],
  canGroup: false,
  column: 'order_id',
  distinctEstimate: 500_000,
  refusal: 'unique-ish',
  role: 'dimension',
  typeName: 'int4',
};

const uiCapability: TableColumnGroupingCapability = serverCapability;
const backToServerCapability: ColumnGroupingCapability = uiCapability;

describe('grouping contract between @lcabrera/ui and @lcabrera/server', () => {
  it('pins the group-key depth cap to one value across both packages', () => {
    // The UI disables its affordances at its own constant and the builder
    // throws past the server's. If these drift the UI offers a depth the query
    // then refuses — or hides one the query would have accepted.
    expect(MAX_TABLE_GROUP_KEYS).toBe(MAX_GROUP_KEYS);
  });

  it('carries the same aggregate vocabulary in both directions', () => {
    // The assignments above are the real check; this asserts the values agree
    // too, so a member reordered or misspelled on one side is visible as a test
    // failure rather than only as a type error somewhere else.
    expect([...uiAggregates].toSorted((a, b) => a.localeCompare(b))).toEqual(
      [...serverAggregates].toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('carries the same role and refusal vocabularies', () => {
    // The round trip is the assertion: `serverRoles` needs UI ⊆ server and
    // `backToUiRoles` needs server ⊆ UI, so a member added to either union
    // alone fails to compile here.
    expect(backToUiRoles).toStrictEqual(uiRoles);
    expect(backToUiRefusals).toStrictEqual(uiRefusals);
    expect(serverRoles).toStrictEqual(uiRoles);
    expect(serverRefusals).toStrictEqual(uiRefusals);
  });

  it('carries the same capability object, refusal arm included', () => {
    expect(backToServerCapability).toStrictEqual(serverCapability);
    expect(uiCapability.canGroup).toBe(false);
    expect(uiCapability.refusal).toBe('unique-ish');
  });
});
