import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';
import type {
  AggregateFn,
  ColumnAnalyticalRole,
  ColumnGroupingCapability,
  GroupKeyPeriod,
  GroupKeyRefusalReason,
} from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type {
  GroupingRefusalReason,
  SerializableDbError,
} from '@lcabrera/server/errors/errors.types';
import type {
  TableAggregateFn,
  TableColumnAnalyticalRole,
  TableColumnGroupingCapability,
  TableGroupingRefusalReason,
  TableGroupKeyRefusalReason,
  TableGroupPeriod,
  TableResponseError,
} from '@lcabrera/ui/components/Table/Table.types';

import { OLAP_GROUP_PERIODS } from '@lcabrera/api/olap/olap.constants';
import {
  GROUP_KEY_PERIODS,
  MAX_GROUP_KEYS,
} from '@lcabrera/server/db/group-query-builder/group-query-builder.constants';
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
  periods: [],
  refusal: 'unique-ish',
  role: 'dimension',
  typeName: 'int4',
};

/**
 * The granularity vocabulary, both directions — and the one union here that
 * cannot drift by construction.
 *
 * It travels in the grouping param and again in the drill param, so it is wire
 * vocabulary and lives in `@lcabrera/api`, which **both** packages already
 * declare (ADR-082). `GroupKeyPeriod` and `TableGroupPeriod` are aliases of that
 * one declaration rather than two of ADR-039's duplicated shapes, because there
 * is no undeclared edge here to route around.
 *
 * It is still asserted, and the assertion is not redundant: it is what fails if
 * either package ever restates the union locally instead of aliasing it — which
 * is exactly the change that would make the two able to disagree (#786).
 */
const uiPeriods: readonly TableGroupPeriod[] = [
  'day',
  'month',
  'quarter',
  'year',
];
const serverPeriods: readonly GroupKeyPeriod[] = uiPeriods;
const backToUiPeriods: readonly TableGroupPeriod[] = serverPeriods;
const wirePeriods: readonly OlapGroupPeriod[] = backToUiPeriods;

const uiCapability: TableColumnGroupingCapability = serverCapability;
const backToServerCapability: ColumnGroupingCapability = uiCapability;

/**
 * Why a grouped **read** was refused, both directions. Distinct from the
 * key-refusal vocabulary above: that one is per column and pre-flight, this one
 * is per request and is what the loader edge returns as data (#642).
 */
const uiGroupingRefusals: readonly TableGroupingRefusalReason[] = [
  'aggregate-not-legal',
  'column-not-groupable',
  'duplicate-keys',
  'estimate-too-large',
  'no-keys',
  'row-limit-reached',
  'too-many-keys',
  'unknown-column',
];
const serverGroupingRefusals: readonly GroupingRefusalReason[] =
  uiGroupingRefusals;
const backToUiGroupingRefusals: readonly TableGroupingRefusalReason[] =
  serverGroupingRefusals;

/**
 * The serializable error union itself, arm for arm.
 *
 * The loader edge maps every failure of a grouped read into
 * `SerializableDbError` and the Table reads it back as `TableResponseError`
 * (#642) — through the loader boundary, where nothing checks the shape at
 * runtime. A member added on one side alone would make the Table silently miss
 * an arm and fall back to "no records match", which is the empty table this
 * exists to prevent. Each arm is written out rather than only the union, so a
 * *widened* arm (one that dropped `reason`, say) fails here too.
 */
const serverErrors: readonly SerializableDbError[] = [
  { code: '23505', kind: 'db-failed', message: 'The database rejected it.' },
  {
    column: 'total_amount',
    estimatedRows: 77_567,
    kind: 'grouping-refused',
    message: 'Column "total_amount" is not a legal group key.',
    reason: 'column-not-groupable',
  },
  { kind: 'db-canceled', message: 'The query was cancelled.' },
  { kind: 'unexpected', message: 'The request could not be completed.' },
];

const uiErrors: readonly TableResponseError[] = serverErrors;
const backToServerErrors: readonly SerializableDbError[] = uiErrors;

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

  it('carries one granularity vocabulary, shared rather than duplicated', () => {
    // The assignments above are the type half. These assert the *values* agree
    // too, so a member added to the wire list alone — or a package restating
    // the union locally — is a test failure rather than only a type error
    // somewhere else.
    expect(backToUiPeriods).toStrictEqual(uiPeriods);
    expect(wirePeriods).toStrictEqual(uiPeriods);
    expect([...GROUP_KEY_PERIODS]).toStrictEqual([...OLAP_GROUP_PERIODS]);
    expect(
      [...OLAP_GROUP_PERIODS].toSorted((a, b) => a.localeCompare(b)),
    ).toEqual([...uiPeriods].toSorted((a, b) => a.localeCompare(b)));
  });

  it('pins the granularity onto the capability object both packages read', () => {
    // The criterion #786 states: the contract covers the granularity, not only
    // the key list. `periods` is what a surface reads instead of `canGroup` for
    // a date column, so a package that dropped or renamed it would hide the one
    // dimension every report is organised by.
    const withPeriods: ColumnGroupingCapability = {
      ...serverCapability,
      column: 'order_date',
      periods: ['month', 'quarter', 'year'],
      refusal: 'too-many-distinct',
      typeName: 'date',
    };
    const uiWithPeriods: TableColumnGroupingCapability = withPeriods;
    const backToServer: ColumnGroupingCapability = uiWithPeriods;

    expect(backToServer).toStrictEqual(withPeriods);
    expect(uiWithPeriods.periods).toStrictEqual(['month', 'quarter', 'year']);
    // `canGroup` and `periods` are independent, and this is the pair that says
    // so: refused as a raw key, legal at three granularities.
    expect(uiWithPeriods.canGroup).toBe(false);
  });

  it('carries the same grouped-read refusal vocabulary in both directions', () => {
    expect(backToUiGroupingRefusals).toStrictEqual(uiGroupingRefusals);
    expect(serverGroupingRefusals).toStrictEqual(uiGroupingRefusals);
  });

  it('carries the same serializable error union, arm for arm', () => {
    // Survives `structuredClone` by construction — this is what crosses the
    // single-fetch boundary, where a class would arrive prototype-less and every
    // `instanceof` on the client would be false without a word (ADR-050).
    expect(backToServerErrors).toStrictEqual(serverErrors);
    expect(structuredClone(uiErrors)).toStrictEqual(uiErrors);
    expect(uiErrors.map((error) => error.kind)).toStrictEqual([
      'db-failed',
      'grouping-refused',
      'db-canceled',
      'unexpected',
    ]);
  });
});
