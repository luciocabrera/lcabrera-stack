import type { OlapGroupPeriod } from '@lcabrera/api/olap/olap.types';
import type {
  CurrencyFormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
} from '@lcabrera/utils/formatters/formatters.types';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { ColumnFilter } from '#ui/types/filterOperators.types';
import type { InfiniteScroll, Sorting } from '#ui/types/ui.types';

/** Derived measure column — not a field of `TData`. Template literal, not `string`. */
export type AggregateColumnKey = `${string}:${TableAggregateFn}`;

export type ColumnFiltersState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  ColumnFilter
>;

export type ColumnOrderState<TData = Record<string, unknown>> =
  readonly DataKey<TData>[];

export type ColumnPinningState<TData = Record<string, unknown>> = {
  readonly left: readonly DataKey<TData>[];
  readonly right: readonly DataKey<TData>[];
};

export type ColumnSizingState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  number
>;

/**
 * Hidden column keys. Membership means hidden, not visible: add to hide, delete
 * to show. An empty Set is every column visible.
 */
export type ColumnVisibilityState<TData = Record<string, unknown>> = Set<
  DataKey<TData>
>;

/**
 * Column identity, not a data path — `'actions'` and `AggregateColumnKey` name
 * no field of `TData`.
 */
export type DataKey<TData> =
  | 'actions'
  | AggregateColumnKey
  | (keyof TData & string);

/** Loader bakes params; the client executor registry owns URL composition. */
export type DistinctFilterOptionsDescriptor = {
  readonly kind: 'distinct';
  readonly params: {
    readonly columnName: string;
    readonly schemaName?: string;
    readonly tableName: string;
  };
  readonly transport: FilterOptionsTransport;
};

export type FilterData = {
  readonly data: string[];
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

/** Survives the loader serialization boundary; fetching is client-side. */
export type FilterOptionsDescriptor =
  | DistinctFilterOptionsDescriptor
  | StaticFilterOptionsDescriptor;

export type FilterOptionsResponse = {
  readonly hasMore: boolean;
  readonly values: string[];
};

/** `bff` hits `/api/distinct`; `loader` hits same-origin `/_api/filter-options`. */
export type FilterOptionsTransport = 'bff' | 'loader';

export type FiltersDataState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  FilterData
>;

export type NormalizedColumnsState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  TableColumn<TData> & {
    readonly sortDirection?: 'asc' | 'desc';
    readonly sortIndex?: number;
  }
>;

export type PinnedColumnInfo = {
  readonly isFirstPinnedRight: boolean;
  readonly isLastPinnedLeft: boolean;
  readonly offset: number;
  readonly side: 'left' | 'right';
};

export type PinnedColumnOffsetsState<TData = Record<string, unknown>> = Partial<
  Record<DataKey<TData>, PinnedColumnInfo>
>;

export type PinnedColumnPartitionState<TData = Record<string, unknown>> = {
  readonly centerCols: readonly TableColumn<TData>[];
  readonly leftPinnedCols: readonly TableColumn<TData>[];
  readonly rightPinnedCols: readonly TableColumn<TData>[];
};

export type SortingState<TData = Record<string, unknown>> = Sorting<TData>[];

export type StaticFilterOptionsDescriptor = {
  readonly kind: 'static';
  readonly values: readonly string[];
};

export type StorageType = 'cookie' | 'localStorage';

/**
 * Duplicated from `@lcabrera/server`'s `AggregateFn` — `@lcabrera/ui` may not
 * import the Node-only server package (ADR-038, ADR-039). Legality per column
 * arrives on `TableMetaState.groupingCapabilities`, not here.
 */
export type TableAggregateFn =
  | 'avg'
  | 'boolAnd'
  | 'boolOr'
  | 'count'
  | 'countDistinct'
  | 'max'
  | 'min'
  | 'sum';

/**
 * Omitted capability flags are not missing: `resolveColumnCapabilities` holds
 * the defaults — read them there rather than testing a flag directly.
 */
export type TableColumn<TData> = {
  readonly dataType?: TableColumnDataType;
  /** Never a function: columns must cross the loader serialization boundary. */
  readonly filterOptionsDescriptor?: FilterOptionsDescriptor;
  readonly format?: TableColumnFormat;
  /** Source column's label; set only by `withAggregateColumns` on a derived measure. */
  readonly headerGroupLabel?: string;
  readonly isFilterable?: boolean;
  /** Consumer's half only: the catalogue can still refuse (ADR-058). */
  readonly isGroupable?: boolean;
  readonly isHeaderHidden?: boolean;
  /** Identifies the row for CRUD; always appended to the query sort for stable pagination. */
  readonly isPrimaryKey?: boolean;
  readonly isResizable?: boolean;
  readonly isSortable?: boolean;
  /** Locked from reorder/pin/resize/hide; not a runtime toggle. */
  readonly isStatic?: boolean;
  readonly key: DataKey<TData>;
  readonly label: string;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly render?: (row: TData) => ReactNode;
};

/**
 * Pair is the identity (`toTableAggregateToken`); a column may carry several
 * functions (#831). Plain record so it survives the loader boundary (ADR-009).
 */
export type TableColumnAggregate = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

/** Duplicated from `@lcabrera/server`'s `ColumnAnalyticalRole` (ADR-038, ADR-039). */
export type TableColumnAnalyticalRole = 'dimension' | 'fact' | 'unsupported';

export type TableColumnDataType =
  | 'boolean'
  | 'currency'
  | 'date'
  | 'number'
  | 'string';

export type TableColumnFormat = {
  readonly currency?: CurrencyFormatOptions;
  readonly date?: DateFormatOptions;
  readonly number?: NumberFormatOptions;
};

/**
 * Catalogue answer, resolved server-side and carried on loader `meta`
 * (ADR-058, ADR-063). Duplicated from server `ColumnGroupingCapability`.
 */
export type TableColumnGroupingCapability =
  | (TableColumnCapabilityShared & {
      readonly canGroup: false;
      readonly refusal: TableGroupKeyRefusalReason;
    })
  | (TableColumnCapabilityShared & {
      readonly canGroup: true;
      readonly refusal?: never;
    });

export type TableColumnLayoutLock = 'group-key' | 'measure';

export type TableColumnsState<TData = Record<string, unknown>> = {
  readonly columnFilters: ColumnFiltersState<TData>;
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: TableColumn<TData>[];
  readonly columnSizing: ColumnSizingState<TData>;
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly effectiveColumns: TableColumn<TData>[];
  readonly normalizedColumns: NormalizedColumnsState<TData>;
  readonly pinnedColumnOffsets: PinnedColumnOffsetsState<TData>;
  readonly pinnedColumnPartition: PinnedColumnPartitionState<TData>;
  readonly sorting: SortingState<TData>;
  readonly staticKeys: Set<string>;
};

/** Serializable subset — derived slices omitted; recomputed client-side. */
export type TableColumnsStateInput<TData = Record<string, unknown>> = Omit<
  TableColumnsState<TData>,
  | 'effectiveColumns'
  | 'normalizedColumns'
  | 'pinnedColumnOffsets'
  | 'pinnedColumnPartition'
  | 'staticKeys'
>;

/**
 * Auto-adds the row-actions column (pinned right) when `read`, `update`, or `delete` is
 * enabled. `create` alone never does. A column declared with `key: 'actions'` is still
 * allowed and is merged onto the auto-generated defaults rather than replacing them.
 */
export type TableCrudConfig = {
  readonly create?: boolean;
  readonly delete?: boolean;
  readonly read?: boolean;
  readonly update?: boolean;
};

export type TableDataState<TData> = {
  readonly data: readonly TData[];
  /**
   * Required and nullable: the provider re-seeds with a shallow merge, so an
   * omitted key would leave a stale refusal on screen.
   */
  readonly error: TableResponseError | undefined;
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

export type TableDensity = 'comfortable' | 'compact';

/**
 * Grid tab-stop (ADR-062). Held here rather than `document.activeElement` —
 * the focused row unmounts when it leaves the virtualization window.
 */
export type TableFocusState = {
  readonly columnKey: string | undefined;
  /** Bumped so re-entering the cell that already holds focus is still a change. */
  readonly focusRequestId: number;
  /** Written from the container's focus/blur, not inferred from the DOM. */
  readonly isGridFocused: boolean;
  readonly rowIndex: number | undefined;
  /** Data-derived identity (ADR-062), never its position. */
  readonly rowKey: string | undefined;
};

/**
 * Unformatted. A pg `numeric`/`bigint` arrives as a string; `Number()` at the
 * cell is lossy past a double, and that loss happens only at the edge that
 * prints.
 */
export type TableGroupAggregateValue = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly value: unknown;
};

/**
 * Client state on the config context, not the data context (recreated on
 * grouping/sort/filter). Own store because `TableGroupingState` crosses the
 * loader boundary where a `Set` cannot go (ADR-009, ADR-067).
 */
export type TableGroupExpansionState = {
  /**
   * Which way a group sits when nobody has touched it — the reader's Global
   * Settings answer, arriving through `TableMetaState.defaultGroupFold`.
   */
  readonly defaultFold: TableGroupFold;
  /**
   * The groups folded the **other way from `defaultFold`**, and only those.
   * Under the shipped `expanded` default that is the collapsed set, which is
   * what it held when it could only mean one thing; under `collapsed` the same
   * membership means expanded. Storing the exceptions rather than the collapsed
   * paths is what lets a group that has not loaded yet still follow the
   * default — the alternative needs the data before it can name a path.
   * Path keys (`resolveGroupPathKey`), never row indexes.
   */
  readonly toggledGroupPaths: ReadonlySet<string>;
};

/** Which way a group sits before anyone has touched it. */
export type TableGroupFold = 'collapsed' | 'expanded';

/**
 * Duplicated from server `GroupingMode` (ADR-038, ADR-039). `cube` is absent:
 * its sets are not prefixes, so it cannot indent as a tree (#574).
 */
export type TableGroupingMode = 'flat' | 'rollup';

/** Duplicated from server `GroupingRefusalReason`. */
export type TableGroupingRefusalReason =
  | 'aggregate-not-legal'
  | 'column-not-groupable'
  | 'duplicate-keys'
  | 'estimate-too-large'
  | 'no-keys'
  | 'row-limit-reached'
  | 'too-many-keys'
  | 'unknown-column';

/**
 * Expansion is not a member: this type crosses the loader boundary and must be
 * serializable (ADR-009, ADR-061).
 */
export type TableGroupingState = {
  /** Order is listing/render order; it shapes no SQL. */
  readonly aggregates: readonly TableColumnAggregate[];
  /** Order is the grouped query's nesting order. */
  readonly keys: readonly string[];
  readonly mode: TableGroupingMode;
  /**
   * Beside `keys`, not inside them: `keys` is `readonly string[]` here, in
   * `@lcabrera/server`, in the URL, in every group path and in the expansion
   * store (#786).
   */
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
  /**
   * Names an aggregate, not a column — `sum` and `count` are both shareable (#831, ADR-086).
   * Changes no SQL; the denominator is derived from already-returned rows.
   */
  readonly shares: readonly TableColumnAggregate[];
};

/** Duplicated from server `GroupKeyRefusalReason` (ADR-038, ADR-039). */
export type TableGroupKeyRefusalReason =
  | 'no-equality-operator'
  | 'not-a-dimension'
  | 'stats-unavailable'
  | 'too-many-distinct'
  | 'unique-ish';

export type TableGroupKeyValue = {
  readonly columnKey: string;
  readonly label: string;
  /**
   * Cannot be recovered from `label` (NULL renders as `(empty)`). `null` is a
   * legitimate group, not a missing value (ADR-087).
   */
  readonly value: unknown;
};

/**
 * Alias of the `@lcabrera/api` wire vocabulary this package already depends on
 * (ADR-082) — not one of ADR-039's duplicated shapes.
 */
export type TableGroupPeriod = OlapGroupPeriod;

/**
 * `TABLE_GROUP_ROW_FIELD` is `keyof` this, so the wire name and the row shape cannot be
 * renamed apart.
 */
export type TableGroupRow = Record<'tableGroup', TableGroupRowSummary>;

/**
 * Path length is the row's depth (ADR-065). Key labels are formatted
 * service-side; aggregates travel raw and are formatted at the cell.
 */
export type TableGroupRowSummary = {
  readonly aggregates: readonly TableGroupAggregateValue[];
  readonly count: number;
  /**
   * Carried, not inferred from path length: a real NULL key and a structural
   * subtotal produce the same `label`.
   */
  readonly isSubtotal: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

export type TableLockedFilter = {
  readonly columnKey: string;
  readonly label: string;
  readonly value: string;
};

export type TableLockedFilters = {
  readonly entries: readonly TableLockedFilter[];
  readonly refusal?: string;
};

export type TableMetadataValue = boolean | number | string;

export type TableMetaState = {
  readonly additionalMetadata?: Readonly<
    Record<string, null | TableMetadataValue | undefined>
  >;
  /** Namespaces persisted keys so apps sharing a `persistenceKey` do not clash. */
  readonly appId?: string;
  readonly columnSelectedKey?: string;
  readonly columnSettingsSelectedTab: string;
  readonly crud?: TableCrudConfig;
  /**
   * The reader's Global Settings answer, read from the settings cookie by the
   * loader and applied only where this table has expressed nothing of its own:
   * `preferredGroupingMode` to a grouping the interaction **creates**, and
   * `defaultGroupFold` to a group nobody has folded. Both absent means the
   * shipped behaviour — `flat`, and every group expanded.
   */
  readonly defaultGroupFold?: TableGroupFold;
  readonly deleteActionPath?: string;
  readonly density: TableDensity;
  readonly drawersSyncNonce?: number;
  readonly enablePrefetch: boolean;
  readonly error?: string;
  /** Path, not a callback — a function does not survive the loader boundary (ADR-009). */
  readonly groupDetailsPath?: string;
  /** `(columnKey, fn)` pairs, not a column-to-function map (#831). */
  readonly groupingAggregates?: readonly TableColumnAggregate[];
  /**
   * Catalogue answer, not a `TableColumn` property (ADR-058). Absent means no
   * aggregate is legal here, not that all of them are.
   */
  readonly groupingCapabilities?: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  /** Empty whenever grouping is off, refused, or unsupported. */
  readonly groupingKeys?: readonly string[];
  /** Absent means `flat` — what a link written before rollup existed says. */
  readonly groupingMode?: TableGroupingMode;
  /** Absent means every key is grouped at its raw values (#786). */
  readonly groupingPeriods?: Readonly<Record<string, TableGroupPeriod>>;
  /** Names an aggregate, not a column (#831). Absent means none. */
  readonly groupingShares?: readonly TableColumnAggregate[];
  /**
   * With a default in play, clearing grouping must record itself in the URL:
   * an absent `grouping` param is "apply the default" (#578).
   */
  readonly hasDefaultGrouping?: boolean;
  readonly initialPageSize: number;
  readonly isBordered: boolean;
  /** Route-declared. Absent means off: the layout persists (ADR-094). */
  readonly isColumnLayoutTransient?: boolean;
  readonly isColumnSettingsOpen: boolean;
  readonly isColumnSettingsPinned: boolean;
  /** Endpoint capability (ADR-063). Absent means off. */
  readonly isGroupingEnabled?: boolean;
  /** Locks keys, mode and per-key granularity — not aggregates. */
  readonly isGroupingLocked?: boolean;
  /** Endpoint capability (ADR-063). Absent means off. */
  readonly isKeysetEnabled?: boolean;
  /** Off by default — the table is square. */
  readonly isRounded: boolean;
  /** Endpoint capability (ADR-063). Absent means off. */
  readonly isServerFilterEnabled?: boolean;
  readonly isStriped: boolean;
  readonly isTableSettingsOpen: boolean;
  readonly isTableSettingsPinned: boolean;
  /**
   * Nested table params carry `TABLE_NESTED_URL_STATE_PREFIX` so they do not
   * collide with the table underneath. Route-declared: a cookie cannot know this.
   */
  readonly isUrlStateNested?: boolean;
  readonly loadMorePageSize: number;
  readonly locale?: string;
  /** Route-declared: what already scopes this read (ADR-063, ADR-094). */
  readonly lockedFilters?: TableLockedFilters;
  readonly overscan: number;
  readonly persistenceKey: string;
  readonly placeholderRowCount: number;
  /** See `defaultGroupFold`. */
  readonly preferredGroupingMode?: TableGroupingMode;
  readonly rowHeight: number;
  readonly schemaName?: string;
  readonly tableName?: string;
  readonly tableSettingsExpandedFilters: readonly string[];
  readonly tableSettingsSelectedTab: string;
  readonly threshold: number;
  readonly title?: TableTitle;
  /** Query setting, not display: emitted as the `GROUPING()` `ORDER BY` direction. */
  readonly totalsPlacement?: TableTotalsPlacement;
  readonly wasTableSettingsOpenBeforeColumnSettings?: boolean;
};

export type TablePersistenceConfig = {
  readonly columnFilters?: StorageType;
  readonly columnOrder?: StorageType;
  readonly columnPinning?: StorageType;
  readonly columnSizing?: StorageType;
  readonly columnVisibility?: StorageType;
  readonly sorting?: StorageType;
};

/**
 * A `{ persistenceKey, slice, valueSlice }` state-slice write, a
 * `{ searchParamKey, searchParamValue }` URL write, or both.
 */
export type TablePersistenceEntry<
  TSlice extends keyof TablePersistenceConfig = keyof TablePersistenceConfig,
> = {
  readonly persistenceKey?: string;
  readonly searchParamKey?: string;
  readonly searchParamValue?: string;
  readonly slice?: TSlice;
  readonly valueSlice?: unknown;
};

export type TablePersistenceSliceEntry<
  TSlice extends keyof TablePersistenceConfig = keyof TablePersistenceConfig,
> = Required<
  Pick<TablePersistenceEntry<TSlice>, 'persistenceKey' | 'slice' | 'valueSlice'>
>;

export type TableProps<
  TData extends Record<string, unknown>,
  TResponse,
> = BaseProps &
  InfiniteScroll<TData, TResponse> & {
    /**
     * A successful response that carries a refusal as data — not a rejected
     * load-more. Omit it and a refusal is indistinguishable from an empty
     * result (#642).
     */
    readonly dataErrorSelector?: (
      response: TResponse,
    ) => TableResponseError | undefined;
    readonly isFlexWrapperEnabled?: boolean;
    readonly isLoading?: boolean;
    readonly response: TResponse;
  };

/**
 * Plain data, not an error class: single-fetch drops the prototype and
 * `Error.message` never arrives (ADR-038/039, ADR-050, ADR-066).
 */
export type TableResponseError =
  | {
      /** Present when the refusal is about exactly one column. */
      readonly column?: string;
      readonly estimatedRows?: number;
      readonly kind: 'grouping-refused';
      readonly message: string;
      readonly reason: TableGroupingRefusalReason;
    }
  | {
      /** Raw SQLSTATE when supplied. Never the message. */
      readonly code?: string;
      readonly kind: 'db-failed';
      readonly message: string;
    }
  | { readonly kind: 'db-canceled'; readonly message: string }
  | { readonly kind: 'unexpected'; readonly message: string };

export type TableTitle = {
  readonly plural: string;
  readonly singular: string;
};

/** Duplicated from server `subtotalPlacement` (ADR-038, ADR-039). */
export type TableTotalsPlacement = 'first' | 'last';

type BaseProps = ComponentPropsWithRef<'table'> & {
  readonly actions?: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
};

type TableColumnCapabilityShared = {
  readonly aggregates: readonly TableAggregateFn[];
  readonly column: string;
  readonly distinctEstimate?: number;
  /** Read instead of `canGroup`, not after it. */
  readonly periods: readonly TableGroupPeriod[];
  readonly role: TableColumnAnalyticalRole;
  readonly typeName: string;
};
