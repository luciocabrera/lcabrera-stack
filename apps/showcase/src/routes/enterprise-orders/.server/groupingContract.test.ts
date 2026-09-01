/**
 * `@lcabrera/ui` and `@lcabrera/server` each declare the grouping vocabulary and
 * the group-key depth cap independently — the client-safe package may not depend
 * on the Node-only one (ADR-038), so neither can import the other's definition
 * (ADR-039). This suite keeps the two in step, in the same shape as the
 * column-filter contract beside it.
 *
 * It lives in the app because the app is the only thing that legitimately
 * depends on both packages, and in `.server/` because it imports a runtime value
 * from `@lcabrera/server/db` rather than a type.
 *
 * Two kinds of assertion. The depth cap is a runtime value, so a plain `expect`
 * catches drift. The unions are types, so the guard is the assignment: each is
 * annotated with the other package's union in both directions, and the file only
 * compiles while every member of each is a member of the other. The annotations
 * are deliberately not `satisfies` — `satisfies` keeps the narrow literal type,
 * so the check would only ever cover the members written here.
 *
 * `GroupingMode` is the one asserted in a single direction: it carries `cube`,
 * which the UI does not (#574 is unbuilt on the client), so what must hold is
 * the subset — every mode the UI can send is one the builder can expand.
 */

import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';
import type {
  AggregateFn,
  ColumnAnalyticalRole,
  ColumnGroupingCapability,
  GroupingMode,
  GroupKeyPeriod,
  GroupKeyRefusalReason,
  GroupQueryDescriptor,
} from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type {
  GroupingRefusalReason,
  SerializableDbError,
} from '@lcabrera/server/errors/errors.types';
import type {
  TableAggregateFn,
  TableColumnAnalyticalRole,
  TableColumnGroupingCapability,
  TableGroupingMode,
  TableGroupingRefusalReason,
  TableGroupingState,
  TableGroupKeyRefusalReason,
  TableGroupPeriod,
  TableResponseError,
  TableTotalsPlacement,
} from '@lcabrera/ui/components/Table/Table.types';

import { OLAP_GROUP_PERIODS } from '@lcabrera/api/olap/olap.constants';
import {
  GROUP_KEY_PERIODS,
  MAX_COUNT_DISTINCT_AGGREGATES,
  MAX_GROUP_KEYS,
} from '@lcabrera/server/db/group-query-builder/group-query-builder.constants';
import {
  MAX_TABLE_COUNT_DISTINCT_AGGREGATES,
  MAX_TABLE_GROUP_KEYS,
  TABLE_AGGREGATE_FNS,
} from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it } from 'vite-plus/test';

const serverAggregates: readonly AggregateFn[] = TABLE_AGGREGATE_FNS;

const uiAggregates: readonly TableAggregateFn[] = serverAggregates;

const uiRoles: readonly TableColumnAnalyticalRole[] = [
  'dimension',
  'fact',
  'unsupported',
];
const serverRoles: readonly ColumnAnalyticalRole[] = uiRoles;
const backToUiRoles: readonly TableColumnAnalyticalRole[] = serverRoles;

const uiRefusals: readonly TableGroupKeyRefusalReason[] = [
  'no-equality-operator',
  'not-a-dimension',
  'stats-unavailable',
  'too-many-distinct',
  'unique-ish',
];
const serverRefusals: readonly GroupKeyRefusalReason[] = uiRefusals;
const backToUiRefusals: readonly TableGroupKeyRefusalReason[] = serverRefusals;

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

const uiPeriods: readonly TableGroupPeriod[] = [
  'day',
  'month',
  'quarter',
  'year',
];
const serverPeriods: readonly GroupKeyPeriod[] = uiPeriods;
const backToUiPeriods: readonly TableGroupPeriod[] = serverPeriods;
const wirePeriods: readonly OlapGroupPeriod[] = backToUiPeriods;

const uiModes: readonly TableGroupingMode[] = ['flat', 'rollup'];
const serverModes: readonly GroupingMode[] = uiModes;

type ServerSubtotalPlacement = NonNullable<
  GroupQueryDescriptor['subtotalPlacement']
>;

const uiPlacements: readonly TableTotalsPlacement[] = ['first', 'last'];
const serverPlacements: readonly ServerSubtotalPlacement[] = uiPlacements;
const backToUiPlacements: readonly TableTotalsPlacement[] = serverPlacements;

const uiGroupingState: TableGroupingState = {
  aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
  keys: ['order_status'],
  mode: 'rollup',
  periods: { order_date: 'month' },
  shares: [{ columnKey: 'total_amount', fn: 'sum' }],
};

const descriptorKeys: GroupQueryDescriptor['keys'] = uiGroupingState.keys;
const descriptorMode: GroupQueryDescriptor['grouping'] = uiGroupingState.mode;
const descriptorPeriods: GroupQueryDescriptor['periods'] =
  uiGroupingState.periods;

const uiCapability: TableColumnGroupingCapability = serverCapability;
const backToServerCapability: ColumnGroupingCapability = uiCapability;

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
    expect(MAX_TABLE_GROUP_KEYS).toBe(MAX_GROUP_KEYS);
  });

  it('pins the countDistinct budget to one value across both packages', () => {
    expect(MAX_TABLE_COUNT_DISTINCT_AGGREGATES).toBe(
      MAX_COUNT_DISTINCT_AGGREGATES,
    );
  });

  it('carries the same aggregate vocabulary in both directions', () => {
    expect([...uiAggregates].toSorted((a, b) => a.localeCompare(b))).toEqual(
      [...serverAggregates].toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('carries the same totals-placement vocabulary in both directions', () => {
    expect(backToUiPlacements).toStrictEqual(uiPlacements);
  });

  it('offers no grouping mode the builder has no expansion for', () => {
    expect(serverModes).toStrictEqual(uiModes);
    expect(uiModes.every((mode) => serverModes.includes(mode))).toBe(true);
  });

  it('hands every state member to the descriptor field it becomes', () => {
    expect(descriptorKeys).toStrictEqual(uiGroupingState.keys);
    expect(descriptorMode).toBe(uiGroupingState.mode);
    expect(descriptorPeriods).toStrictEqual(uiGroupingState.periods);
  });

  it('carries the same role and refusal vocabularies', () => {
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
    expect(backToUiPeriods).toStrictEqual(uiPeriods);
    expect(wirePeriods).toStrictEqual(uiPeriods);
    expect([...GROUP_KEY_PERIODS]).toStrictEqual([...OLAP_GROUP_PERIODS]);
    expect(
      [...OLAP_GROUP_PERIODS].toSorted((a, b) => a.localeCompare(b)),
    ).toEqual([...uiPeriods].toSorted((a, b) => a.localeCompare(b)));
  });

  it('pins the granularity onto the capability object both packages read', () => {
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
    expect(uiWithPeriods.canGroup).toBe(false);
  });

  it('carries the same grouped-read refusal vocabulary in both directions', () => {
    expect(backToUiGroupingRefusals).toStrictEqual(uiGroupingRefusals);
    expect(serverGroupingRefusals).toStrictEqual(uiGroupingRefusals);
  });

  it('carries the same serializable error union, arm for arm', () => {
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
