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

/**
 * The key of a **derived** measure column: one applied aggregate, spelled by
 * `toTableAggregateToken` (`"total_amount:avg"`).
 *
 * These columns are not declared by the consumer and hold no field of `TData` —
 * `withAggregateColumns` produces them while a grouping is applied and they
 * disappear when it clears. The template literal is what keeps the widening
 * honest: the function half is a closed vocabulary, so this admits far less
 * than `string` would while still admitting every key the derivation emits.
 */
export type AggregateColumnKey = `${string}:${TableAggregateFn}`;

/**
 * Column filters state - maps column key to filter configuration
 */
export type ColumnFiltersState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  ColumnFilter
>;

/**
 * Column order state - array of column keys in display order
 */
export type ColumnOrderState<TData = Record<string, unknown>> =
  readonly DataKey<TData>[];
/**
 * Column pinning state
 */
export type ColumnPinningState<TData = Record<string, unknown>> = {
  /** Columns pinned to the left */
  readonly left: readonly DataKey<TData>[];
  /** Columns pinned to the right */
  readonly right: readonly DataKey<TData>[];
};

/**
 * Column sizing state - maps column key to custom width
 */
export type ColumnSizingState<TData = Record<string, unknown>> = Record<
  DataKey<TData>,
  number
>;

/**
 * Column visibility state — Set of **hidden** column keys.
 *
 * Membership means hidden, not visible: `resolveColumnVisibilityUpdate` adds a
 * key to hide it and deletes it to show it, readers derive
 * `isVisible = !columnVisibility.has(key)`, and `size` counts hidden columns.
 * An empty Set therefore means every column is visible.
 */
export type ColumnVisibilityState<TData = Record<string, unknown>> = Set<
  DataKey<TData>
>;

/**
 * Every key the grid can address a column by.
 *
 * Two members name no field of `TData`, by the same precedent: `'actions'` is
 * the grid's own command column, and `AggregateColumnKey` is a derived measure
 * column. A key here is a **column identity**, not a data path —
 * `buildTableBodyCellDescriptor` already reads a row through `Object.hasOwn`
 * and renders nothing where the field is absent, so a key with no field behind
 * it is an ordinary case rather than a special one.
 */
export type DataKey<TData> =
  | 'actions'
  | AggregateColumnKey
  | (keyof TData & string);

/**
 * Serializable "tool call" describing how the client fetches distinct
 * filter options for a column. The server (loader) bakes the concrete
 * params; the client executor registry owns URL composition, pagination
 * mapping, and response mapping per transport.
 */
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

/**
 * Serializable descriptor for a column's filter-option list. Unlike
 * function-valued members, descriptors survive the React Router loader
 * serialization boundary; the client tool
 * (`resolveFilterOptionsDescriptor`) interprets them and performs all
 * fetching client-side.
 */
export type FilterOptionsDescriptor =
  | DistinctFilterOptionsDescriptor
  | StaticFilterOptionsDescriptor;

/**
 * Response shape produced by filter-option executors.
 * Contains paginated distinct values for a column's filter dropdown.
 */
export type FilterOptionsResponse = {
  readonly hasMore: boolean;
  readonly values: string[];
};

/**
 * How a distinct descriptor reaches data: `bff` hits the API server's
 * generic /api/distinct endpoint; `loader` hits the same-origin
 * /_api/filter-options resource route (which calls the BFF server-side).
 */
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

/**
 * Pre-computed pinned column offset map stored in columnsStore.
 */
export type PinnedColumnOffsetsState<TData = Record<string, unknown>> = Partial<
  Record<DataKey<TData>, PinnedColumnInfo>
>;

/**
 * Pre-computed pinned column partition — columns split by pinning side,
 * stored in columnsStore.
 */
export type PinnedColumnPartitionState<TData = Record<string, unknown>> = {
  readonly centerCols: readonly TableColumn<TData>[];
  readonly leftPinnedCols: readonly TableColumn<TData>[];
  readonly rightPinnedCols: readonly TableColumn<TData>[];
};

/**
 * Sorting state for a single column
 */
export type SortingState<TData = Record<string, unknown>> = Sorting<TData>[];

/** Serializable descriptor for a build-time (static) filter-option list. */
export type StaticFilterOptionsDescriptor = {
  readonly kind: 'static';
  readonly values: readonly string[];
};

/**
 * Storage type for persistence
 */
export type StorageType = 'cookie' | 'localStorage';

/**
 * The aggregate vocabulary a grouped read may request, **duplicated** from
 * `@lcabrera/server`'s `AggregateFn` rather than imported.
 *
 * `@lcabrera/ui` is client-safe and may not depend on the Node-only server
 * package (ADR-038), so the two are written twice and kept in step by a
 * conformance test in the app that legitimately depends on both (ADR-039) —
 * `apps/react-router/src/routes/enterprise-orders/groupingContract.test.ts`.
 *
 * Which members are legal for a given column is **not** decided here: that is a
 * catalogue answer that reaches the client on `TableMetaState.groupingCapabilities`
 * (ADR-058, ADR-063). This union is only the closed set of tokens the URL codec
 * will accept.
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
 * A column definition. The capability flags (`isFilterable`, `isGroupable`,
 * `isResizable`, `isSortable`, `isStatic`) are optional and an omitted one is
 * NOT a missing value — every surface resolves them through `resolveColumnCapabilities`,
 * which holds the defaults, so read them there rather than testing a flag
 * directly.
 */
export type TableColumn<TData> = {
  readonly dataType?: TableColumnDataType;
  /**
   * Serializable descriptor for the column's filter-option list (distinct
   * fetch or static values). Interpreted client-side by
   * `resolveFilterOptionsDescriptor` — never a function, so columns can
   * cross the loader serialization boundary intact.
   */
  readonly filterOptionsDescriptor?: FilterOptionsDescriptor;
  /** Format options for the column based on data type */
  readonly format?: TableColumnFormat;
  /**
   * The label of the column this one was derived **from**, when it was derived
   * at all — the source column of a measure column, so the header can state
   * `Total Amount` once above `Average` and `Minimum` rather than repeating it
   * in each.
   *
   * Absent on a declared column, which is its own source. Set only by
   * `withAggregateColumns`, and read only by the header — a body cell renders
   * the measure, which the label below already names.
   */
  readonly headerGroupLabel?: string;
  /** Whether this column can be filtered. */
  readonly isFilterable?: boolean;
  /**
   * Whether this column may be offered as a group key. It is the consumer's
   * half of the answer only: the route's endpoint decides what is actually
   * legal from the catalogue (ADR-058), so a column allowed here can still be
   * refused there.
   */
  readonly isGroupable?: boolean;
  /** Whether to hide the header content (label, controls, resize handle) */
  readonly isHeaderHidden?: boolean;
  /**
   * Whether this column is part of the table's primary key. The primary-key
   * column(s) identify a row for CRUD links/actions and are always appended
   * to the query sort (in declaration order) to guarantee a stable ordering
   * for pagination.
   */
  readonly isPrimaryKey?: boolean;
  /** Whether this column can be resized by the user. */
  readonly isResizable?: boolean;
  /** Whether this column is sortable. */
  readonly isSortable?: boolean;
  /**
   * Whether this column is fully locked from user modifications.
   * When true, the column cannot be reordered, pinned/unpinned, resized, or hidden.
   * This is a read-only configuration — it cannot be changed at runtime.
   */
  readonly isStatic?: boolean;
  readonly key: DataKey<TData>;
  readonly label: string;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  /** Custom render function for body cells. Receives the row data. */
  readonly render?: (row: TData) => ReactNode;
};

/**
 * One aggregate applied to one column — the element of both of
 * `TableGroupingState`'s aggregate lists (`aggregates` and `shares`).
 *
 * Neither half identifies an entry on its own, because a column may carry
 * several aggregates at once (#831): the pair is the identity, and
 * `toTableAggregateToken` is the one spelling of that identity as a string.
 *
 * A plain record rather than a tuple or a `Map` entry, because this crosses the
 * loader boundary inside `TableGroupingState` and must stay plain and
 * serializable (ADR-009).
 */
export type TableColumnAggregate = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

/**
 * ADR-058's Gate 1, as the client sees it: a dimension is what you group by, a
 * fact is what you aggregate, and everything else is out of both. Duplicated
 * from `@lcabrera/server`'s `ColumnAnalyticalRole` for the reason
 * `TableAggregateFn` is.
 */
export type TableColumnAnalyticalRole = 'dimension' | 'fact' | 'unsupported';

export type TableColumnDataType =
  | 'boolean'
  | 'currency'
  | 'date'
  | 'number'
  | 'string';

/**
 * Format options for a column based on its data type
 */
export type TableColumnFormat = {
  /** Currency formatting options (for dataType: 'currency') */
  readonly currency?: CurrencyFormatOptions;
  /** Date formatting options (for dataType: 'date') */
  readonly date?: DateFormatOptions;
  /** Number formatting options (for dataType: 'number') */
  readonly number?: NumberFormatOptions;
};

/**
 * What one column may do in a grouped read, as the catalogue answered it —
 * ADR-058's two gates resolved server-side and carried to the client on the
 * loader `meta` (ADR-063), because neither gate is answerable in the browser.
 *
 * Duplicated from `@lcabrera/server`'s `ColumnGroupingCapability`, discriminated
 * arm for discriminated arm, so a refusal still cannot arrive without its
 * reason. The whole object travels rather than a trimmed aggregate list:
 * `canGroup`/`refusal` cost nothing extra on a round trip that had to happen
 * anyway, and the group-key refusal surface (#642) reads them.
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

/**
 * Main table state stored in tableStore
 */
export type TableColumnsState<TData = Record<string, unknown>> = {
  /** Column filters state */
  readonly columnFilters: ColumnFiltersState<TData>;
  /** Column order state */
  readonly columnOrder: ColumnOrderState<TData>;
  /** Column pinning state */
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: TableColumn<TData>[];
  /** Column sizing state (custom widths) */
  readonly columnSizing: ColumnSizingState<TData>;
  /** Column visibility state */
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly effectiveColumns: TableColumn<TData>[];
  readonly normalizedColumns: NormalizedColumnsState<TData>;
  /** Pre-computed pinned column offset map */
  readonly pinnedColumnOffsets: PinnedColumnOffsetsState<TData>;
  /** Pre-computed pinned column partition (columns split by pinning side) */
  readonly pinnedColumnPartition: PinnedColumnPartitionState<TData>;
  /** Sorting state */
  readonly sorting: SortingState<TData>;
  /** Keys of columns marked as static (computed once from columns) */
  readonly staticKeys: Set<string>;
};

/**
 * Serializable subset of `TableColumnsState` — omits the derived/computed
 * slices (groups, effective/normalized columns, pinned offsets, static keys)
 * that are recomputed client-side. Used for loader-seeded initial state
 * (`TableLayout`'s `columnsState` prop).
 */
export type TableColumnsStateInput<TData = Record<string, unknown>> = Omit<
  TableColumnsState<TData>,
  | 'effectiveColumns'
  | 'normalizedColumns'
  | 'pinnedColumnOffsets'
  | 'pinnedColumnPartition'
  | 'staticKeys'
>;

/**
 * CRUD feature flags for a table. Each flag toggles a database operation
 * (create / read / update / delete) exposed through the row actions menu and
 * create link. The row id used by those actions is derived from the column(s)
 * marked `isPrimaryKey`; the delete endpoint is configured via
 * `TableMetaState.deleteActionPath`.
 *
 * The table auto-adds its row-actions column (pinned right) whenever
 * `read`, `update`, or `delete` is enabled — consumers no longer need to
 * declare a `key: 'actions'` column by hand. `create` alone never adds it
 * (it only renders the header-level create link, which needs no row id). A
 * column with `key: 'actions'` is still optional for consumers who want to
 * append custom per-row menu content (typically via `render`); it is merged
 * onto the auto-generated defaults rather than replacing them.
 */
export type TableCrudConfig = {
  readonly create?: boolean;
  readonly delete?: boolean;
  readonly read?: boolean;
  readonly update?: boolean;
};

export type TableDataState<TData> = {
  /** Table data array */
  readonly data: readonly TData[] /** Pagination state */;
  /**
   * Why this read returned no rows, when the endpoint said so. Required and
   * nullable rather than optional, because the provider re-seeds the store with
   * a **shallow merge**: a key the next state omits keeps the value the last one
   * put there, so an optional member would leave a refusal on screen after the
   * navigation that resolved it.
   */
  readonly error: TableResponseError | undefined;
  /** Whether there are more rows to load (infinite scroll) */
  readonly hasMore: boolean;
  /** Initial loading state */
  readonly isLoading: boolean;
  /** Loading more rows (infinite scroll) */
  readonly isLoadingMore: boolean;
  // pagination: PaginationState;
  readonly totalLoadedRows: number;
  /** Total number of rows (for progress indication) */
  readonly totalRows: number;
};

export type TableDensity = 'comfortable' | 'compact';

export type TableDrillRow = Record<'tableDrill', TableDrillRowMarker>;

/**
 * What a grid-created drill row says.
 *
 * `failed` is one member and carries no reason: a refusal and a timeout differ
 * to the server and not to the reader of one group row (ADR-079, amended).
 */
export type TableDrillRowKind = 'failed' | 'handoff' | 'loading';

export type TableDrillRowMarker = {
  /**
   * `handoff` carries the shortfall — how many of the group's rows the fetched
   * page did **not** include. It is `summary.count` minus the page, computed
   * where both are known rather than recomputed at the cell.
   */
  readonly kind: TableDrillRowKind;
  /** The group's own path, so a hand-off can rebuild the drill's filters. */
  readonly path: readonly TableGroupKeyValue[];
  /** The group this row belongs to, keyed as `resolveGroupPathKey` encodes it. */
  readonly pathKey: string;
  readonly shortfall: number;
};

/**
 * The focus store's state — where the grid's single tab stop points (ADR-062).
 *
 * Focus is held here rather than read back from `document.activeElement`,
 * because the focused row is unmounted the moment it leaves the virtualization
 * window: the DOM cannot be the source of truth for something it stops
 * containing.
 */
export type TableFocusState = {
  /** Key of the focused column; absent while the grid holds no cell focus. */
  readonly columnKey: string | undefined;
  /**
   * Bumped whenever focus must be applied to the DOM node representing the
   * focused cell. A cell watches this id rather than a boolean, so asking again
   * for the cell that already holds focus is still a change — which is what
   * re-entering the grid does.
   */
  readonly focusRequestId: number;
  /**
   * Whether DOM focus currently sits inside the grid. It decides which of the
   * grid container and the focused cell carries the tab stop, and it is written
   * from the container's own focus/blur events rather than inferred.
   */
  readonly isGridFocused: boolean;
  /** Absolute index of the focused row among the loaded rows. */
  readonly rowIndex: number | undefined;
  /** Data-derived identity of the focused row (ADR-062), never its position. */
  readonly rowKey: string | undefined;
};

/**
 * One aggregate a grouped row carries, **unformatted**.
 *
 * It travels as the raw value rather than as a rendered string, which is the
 * opposite of how `path` travels and deliberately so. A key label cannot be
 * formatted client-side — nothing in the row says which column a key came from
 * in a way the table can resolve back to a `dataType`. An aggregate names its
 * `columnKey`, and the columns store answers that name with the column's
 * `dataType` and `format`, so `TableGroupAggregate` can render the value
 * through exactly the path a data cell in that column uses.
 *
 * Formatting it service-side instead is what put a raw Postgres `numeric`
 * string under a currency header: `sum(total_amount)` arrives as
 * `"302540833.38"`, and a service with no access to the column descriptor has
 * nothing better to do with it than pass it along.
 */
export type TableGroupAggregateValue = {
  /** The column the aggregate was applied to. */
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  /**
   * The aggregate's raw value, exactly as the read produced it. A `numeric` or
   * `bigint` aggregate arrives from `pg` as a **string**, because neither
   * survives a JS number losslessly, and it is carried here as one.
   *
   * **Rendering it is still lossy past a double**, and this is the honest
   * limit of the type rather than a guarantee against it: the cell formats
   * through `renderCellContent`, which calls `Number()` on the string, so a
   * value beyond ~15–17 significant digits is rounded on the way to the
   * screen — `'9007199254740993.55'` prints as `9,007,199,254,740,994.00`.
   * What the string buys is that the loss happens **once, at the edge that
   * prints**, and only there: this value is still exact for a consumer that
   * reads it for anything else. A grid that needs exact display past a double
   * needs a formatter that never converts, which this is not.
   */
  readonly value: unknown;
};

/**
 * The expansion store's state — which group rows are open (ADR-061, ADR-067).
 *
 * It is client state and it is the config context's, not the data context's: a
 * grouping, sort or filter change re-creates the data context, and expansion
 * held there would be discarded before the path re-application meant to restore
 * it could run.
 *
 * It is its own store rather than a field on `TableGroupingState` because that
 * type is the URL codec's and the loader's, and everything in it crosses the
 * single-fetch boundary where a `Set` cannot go (ADR-009).
 */
/**
 * One group's drilled page: the rows fetched for it, and how far that fetch got.
 *
 * `rows` is empty while `loading` and holds the page once `loaded` — the two
 * travel together because a renderer asking "what do I paint under this group"
 * needs both answers from one read, and a status without its rows invites a
 * splice that reads them from somewhere else.
 */
export type TableGroupDrill = {
  /** Empty while `loading` and after `failed`; the fetched page once `loaded`. */
  readonly rows: readonly Record<string, unknown>[];
  readonly status: TableGroupDrillStatus;
};

/**
 * A row the **grid** creates to say something about a drill, rather than one a
 * read returned (ADR-079).
 *
 * It is a row and not an overlay, and that is the height invariant rather than a
 * stylistic call: `TableBody` sizes `<tbody>` from `rows.length` times the
 * store's `rowHeight`, so anything occupying vertical space has to be in that
 * array and paint at that height. A banner outside it desynchronises the
 * declared height from what is painted, which is the defect ADR-065 removed for
 * group rows and this must not reintroduce for drill chrome.
 */
/**
 * What a route supplies so a group can fetch its own rows (ADR-079).
 *
 * A function rather than a serializable descriptor, and the asymmetry with
 * `filterOptionsDescriptor` (ADR-009) is deliberate: that one travels **through
 * the loader**, where single-fetch encoding silently replaces a function with
 * `undefined`. This is a prop on a client component, exactly like `onLoadMore`,
 * so it never crosses that boundary.
 *
 * It resolves to the group's rows or rejects. A rejection is one state here — a
 * refusal and a timeout differ to the route and not to the reader of one group
 * row — so the reason is not part of the contract.
 */
export type TableGroupDrillFetcher = (
  args: TableGroupDrillRequest,
) => Promise<readonly Record<string, unknown>[]>;

/** The group a drill names: its complete path, and the keys it is complete against. */
export type TableGroupDrillRequest = {
  readonly groupingKeys: readonly string[];
  readonly path: readonly TableGroupKeyValue[];
};

/**
 * How far a group's drill has got (ADR-079, amended 2026-08-19).
 *
 * A group with no entry is `idle` — nothing has been asked for — so the union
 * names only the states a drill actually occupies once it has been.
 *
 * **`failed` carries no reason.** A refusal and a timeout differ to the server
 * and not to the reader of one group row, and a state that fans out per cause
 * is one every renderer has to exhaust. What the row needs to say is that the
 * rows were asked for and did not arrive.
 *
 * **`failed` is not terminal; `loaded` is.** Toggling a failed group re-enters
 * `loading`, which is the retry — deliberate, and asked for. Returning it to
 * `idle` instead would leave a chevron that appears to do nothing, so the next
 * click repeats the same failing request: a retry loop the interface invited.
 */
export type TableGroupDrillStatus = 'failed' | 'loaded' | 'loading';

export type TableGroupExpansionState = {
  /**
   * Group paths whose subtree is **hidden** — the tree's expansion state, held
   * by its complement.
   *
   * Membership means collapsed, not expanded, exactly as
   * `ColumnVisibilityState` holds the *hidden* columns. An empty set is a fully
   * expanded tree, which is the state a grouped read already materialises
   * (ADR-059) and so the one that costs nothing to render.
   *
   * A member is a group's whole path, encoded by `resolveGroupPathKey`, never a
   * row index — that is what lets a collapse be re-applied after a refetch and
   * survive a sort (ADR-061).
   */
  readonly collapsedGroupPaths: ReadonlySet<string>;
  /**
   * Per-group drilled rows and fetch state, keyed by the same
   * `resolveGroupPathKey` string the collapsed set uses (ADR-079).
   *
   * A group with no entry is `idle`: nothing has been asked for. Storing the
   * absence rather than an explicit `idle` entry is what keeps an ungrouped or
   * undrilled table's expansion state empty, which is the state that costs
   * nothing to derive.
   *
   * `loaded` is **terminal**. A drill fetches one bounded page and never pages
   * again, so there is no state for "loading more" — where the group holds more
   * rows than the page, the answer is the hand-off row, not another request.
   * `failed` is not terminal: toggling the group retries it.
   */
  readonly drilledGroups: ReadonlyMap<string, TableGroupDrill>;
};

/**
 * Which grouping sets a grouped read emits — duplicated from
 * `@lcabrera/server`'s `GroupingMode` for the reason `TableAggregateFn` is
 * (ADR-038, ADR-039), and pinned to it by `groupingContract.test.ts`.
 *
 * `flat` emits one set: one row per distinct combination of every key, and no
 * row is anything's parent. `rollup` emits that set plus one per key dropped
 * from the tail, down to the empty grand total — so every set is a **prefix**
 * of the key list, every row has at most one parent, and a row's path length is
 * its depth. That is what the hierarchy column indents by (ADR-065).
 *
 * `cube` is deliberately absent (#574): its sets are not prefixes, so its rows
 * form a lattice rather than a tree and it renders flat rather than indented.
 * Adding it here would let the URL ask for a shape nothing renders.
 */
export type TableGroupingMode = 'flat' | 'rollup';

/**
 * Why the endpoint refused to **run** a grouped read, as opposed to why a single
 * column may not be a key (`TableGroupKeyRefusalReason`). Both exist because the
 * two questions are answered at different times: a column's legality is settled
 * per column before anything is selected, while these depend on the whole
 * request — its depth, its key combination, or the row bound the combination
 * implies — so no per-column answer can predict them.
 *
 * Duplicated from `@lcabrera/server`'s `GroupingRefusalReason` for the reason
 * `TableAggregateFn` is, and pinned by the same contract test.
 */
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
 * The grouping store's state — the config context's third store (ADR-061).
 *
 * `aggregates` is an **ordered list of `(columnKey, fn)` records**, so one
 * column may carry several functions at once and the list's order is the order
 * the user arranged them in (#831). It travels in the compact `grouping` param
 * as an ordered array of `"<columnKey>:<fn>"` tokens, which is what keeps the
 * whole configuration round-trippable — a state the transport cannot express is
 * a state a shared link silently loses (ADR-061).
 *
 * It is still the shape of the #569 deferral: there is no slot here for a
 * filter, so no state this package can hold describes a *filtered* aggregate and
 * no interaction can produce one. `@lcabrera/server`'s `GroupAggregate` still
 * has the slot, so a consumer calling its grouped read directly can build one —
 * what is closed is every path through this package, not the capability itself.
 *
 * It is a store rather than a field on the columns store because expansion sits
 * beside it on the same context, and both must survive the data context being
 * re-created on every navigation (ADR-061).
 *
 * Expansion is **not** a member here: this type is also the URL codec's and the
 * loader's (`createTableRouteLoader`'s `grouping`), so everything in it crosses
 * the single-fetch boundary and must be plain and serializable (ADR-009). A
 * `Set` is neither. See `TableGroupExpansionState` and ADR-067.
 */
export type TableGroupingState = {
  /**
   * Ordered, and no `(columnKey, fn)` pair repeated. The order is the order the
   * aggregates are listed and rendered in; it shapes no SQL.
   */
  readonly aggregates: readonly TableColumnAggregate[];
  /** Ordered — the order is the grouped query's nesting order. */
  readonly keys: readonly string[];
  /** Which grouping sets the read emits. See `TableGroupingMode`. */
  readonly mode: TableGroupingMode;
  /**
   * The granularity each temporal key is grouped at, by column — a map beside
   * the key list rather than a member of it.
   *
   * A key list of records would carry the granularity inside each key, and was
   * rejected: `keys` is `readonly string[]` here, in `@lcabrera/server`, in the
   * URL, in every group path and in the expansion store, so changing its element
   * type moves a shape six unrelated things already agree on. A column can be a
   * key at most once, so a column-keyed map is per-key by construction (#786).
   */
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
  /**
   * The **aggregates** rendering as a share of the grand total, as a list
   * rather than a map: unlike an aggregate or a granularity a share carries no
   * value of its own — the measure either shows one or does not (#648).
   *
   * It names an aggregate rather than a column, because `sum` and `count` are
   * both shareable and a column may carry both at once — a bare column key
   * could not say which measure's share was meant (#831, widening ADR-086).
   * Every entry must also appear in `aggregates`.
   *
   * It changes no SQL. The denominator is derived from the rows the read
   * already returned (ADR-086), so this travels in the URL for the same reason
   * the rest of the configuration does — a shared link opens showing what its
   * author saw — and for no query-shaping reason at all.
   */
  readonly shares: readonly TableColumnAggregate[];
};

/**
 * Why a column may not be a group key. Duplicated from `@lcabrera/server`'s
 * `GroupKeyRefusalReason` for the reason `TableAggregateFn` is; the reasons stay
 * distinguishable because grouping by a primary key is the likeliest user
 * mistake and deserves to say so.
 */
export type TableGroupKeyRefusalReason =
  | 'no-equality-operator'
  | 'not-a-dimension'
  | 'stats-unavailable'
  | 'too-many-distinct'
  | 'unique-ish';

/**
 * One level of a group's identity: the column, its value **formatted** for
 * display, and that value **raw**. Both are carried because neither answers the
 * other's question — see the fields.
 */
export type TableGroupKeyValue = {
  /** The group key column this entry is for. */
  readonly columnKey: string;
  /**
   * The key **formatted for display**, produced service-side.
   *
   * It stays formatted rather than being rendered at the cell, and the asymmetry
   * with `TableGroupAggregateValue` is real rather than an oversight: an
   * aggregate names the column it was applied to, so the cell can ask the
   * columns store for that column's `dataType` and `format`. A path entry
   * cannot — nothing in the row resolves it back to a column descriptor — so the
   * only side that knows how to format a key is the one that read it.
   *
   * This is also the string `resolveGroupPathKey` encodes into the key
   * expansion is stored under, so changing what it holds invalidates every
   * stored collapse.
   */
  readonly label: string;
  /**
   * The key's **raw value**, exactly as the read produced it — what a filter is
   * built from when a group is turned back into the restriction it came from
   * (ADR-079).
   *
   * It cannot be recovered from `label`, which is why both are carried:
   * formatting is lossy in exactly the direction a query needs. A NULL key
   * renders as `(empty)`, and `category = '(empty)'` matches nothing — silently,
   * on the group a user is most likely to click. A date renders as an ISO
   * string, a boolean as `'true'`.
   *
   * `unknown` because a key is whatever its column is, and `null` is a
   * legitimate value rather than a missing one — a NULL group is a group.
   */
  readonly value: unknown;
};

/**
 * The granularity a date or timestamp group key is truncated to.
 *
 * An alias of the wire vocabulary, which `@lcabrera/api` owns and this package
 * already depends on (ADR-082) — so unlike the aggregate and refusal unions
 * beside it, this one is a single declaration rather than one of ADR-039's
 * duplicated shapes. There is no undeclared edge to route around here.
 */
export type TableGroupPeriod = OlapGroupPeriod;

/**
 * A row carrying a group summary — what a grouped read returns for each group.
 *
 * The field name lives here, in a type, and `TABLE_GROUP_ROW_FIELD` is declared
 * `keyof` it, so the constant the writer uses and the member the reader's type
 * declares cannot be renamed apart.
 *
 * A route intersects `Partial<TableGroupRow>` into its own row type: the summary
 * is present only on grouped rows, and its absence is what a detail row is.
 */
export type TableGroupRow = Record<'tableGroup', TableGroupRowSummary>;

/**
 * The group summary a grouped read attaches to every row it returns, under
 * `TABLE_GROUP_ROW_FIELD`.
 *
 * It is the whole contract between a route's grouped service and the
 * group-header row. The table never infers "this row is a group" from the
 * grouping configuration, so a grouped row and a detail row can sit in the same
 * result — which is what the nested rows in a later slice need.
 *
 * `path` is the group's key values **in key order** and is what makes a
 * multi-key group identifiable: with two keys applied, a group is the pair, and
 * a single `columnKey`/`label` could only ever name one of them. A one-key
 * grouping is the one-element case, not a different shape.
 *
 * It holds **only the keys the row's grouping set actually grouped by**, so its
 * length is the row's depth: under a rollup a subtotal over the innermost key
 * carries one entry fewer than a leaf does, and the grand total carries none.
 * That is what the hierarchy column indents by (ADR-065).
 *
 * Every key `label` is already formatted, because formatting a key value needs
 * the column's `dataType` and locale, and nothing in the row resolves a key
 * back to the column it came from. **Aggregates are the other way round** —
 * they name their column, so they travel raw and are formatted at the cell.
 * See `TableGroupAggregateValue`.
 */
export type TableGroupRowSummary = {
  /** The selected aggregates, in the order the read emitted them. */
  readonly aggregates: readonly TableGroupAggregateValue[];
  /** How many rows the group aggregates. */
  readonly count: number;
  /**
   * Whether this row totals the levels below it rather than being one of them.
   *
   * It is carried, not inferred. A shorter `path` says the same thing only by
   * comparison with the grouping configuration, and the row is the one thing
   * that survives a configuration change intact — the table never asks the
   * configuration what a row is (see above). It is also the only carrier for
   * the distinction the rendering exists to make: a real NULL key and a
   * structural subtotal produce the same `label` from the same column, and
   * nothing in the row text separates them.
   */
  readonly isSubtotal: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

export type TableMetadataValue = boolean | number | string;

export type TableMetaState = {
  readonly additionalMetadata?: Readonly<
    Record<string, null | TableMetadataValue | undefined>
  >;
  /**
   * Per-application identifier used to namespace persisted cookie / storage
   * keys so tables in different apps that share a `persistenceKey` do not clash.
   */
  readonly appId?: string;
  readonly columnSelectedKey?: string;
  readonly columnSettingsSelectedTab: string;
  readonly crud?: TableCrudConfig;
  /** Action route the row delete submit posts to (required when crud.delete) */
  readonly deleteActionPath?: string;
  readonly density: TableDensity;
  readonly drawersSyncNonce?: number;
  /** Whether to prefetch the next page after each load-more completes */
  readonly enablePrefetch: boolean;
  /** Error message if data fetch failed */
  readonly error?: string;
  /**
   * The aggregates the loader actually applied, in order, sanitized alongside
   * `groupingKeys` from the same `grouping` param. Seeds the grouping store.
   *
   * A list of `(columnKey, fn)` pairs rather than a column-to-function map,
   * because a column may carry several aggregates at once (#831).
   */
  readonly groupingAggregates?: readonly TableColumnAggregate[];
  /**
   * What each of this route's columns may do in a grouped read, as the
   * catalogue answered it (ADR-058), keyed by column.
   *
   * It is here rather than on `TableColumn` because it is not a property of the
   * consumer's column declaration: the same column is legal or not depending on
   * the real Postgres type behind it, which only the server can see. The
   * aggregate menu is built from this and from nothing else — a menu shaped
   * from `dataType` offers `sum` on a `numeric` it thinks is a `string`, and
   * hides it on the one it does not (#550).
   *
   * Absent means the route resolved none, which the menu reads as "no aggregate
   * is legal here" rather than as "all of them are".
   */
  readonly groupingCapabilities?: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  /**
   * The group keys the loader actually applied, read from the `grouping` search
   * param and sanitized against this route's columns (ADR-061). It seeds the
   * grouping store; the store is the live value from then on, exactly as
   * `columnsState.sorting` seeds the columns store.
   *
   * Empty whenever grouping is off, refused, or unsupported by the route — so
   * "is this table grouped" is one question with one answer.
   */
  readonly groupingKeys?: readonly string[];
  /**
   * The grouping mode the loader applied, sanitized from the same `grouping`
   * param. Absent means `flat` — what a link written before rollup existed
   * says, and what a route that never offers the choice keeps.
   */
  readonly groupingMode?: TableGroupingMode;
  /**
   * The granularity the loader applied to each temporal key, by column, from
   * the same `grouping` param. Absent means every key is grouped at its raw
   * values — what a link written before granularities existed says (#786).
   */
  readonly groupingPeriods?: Readonly<Record<string, TableGroupPeriod>>;
  /**
   * The aggregates the loader applied a share of the grand total to, from the
   * same `grouping` param. Seeds the grouping store; absent means none, which
   * is what every link written before shares existed says (#648).
   *
   * It names an aggregate rather than a column for the reason
   * `TableGroupingState.shares` does (#831).
   */
  readonly groupingShares?: readonly TableColumnAggregate[];
  /**
   * Whether this route declared a default grouping (#578). It is the client's
   * half of that declaration: with a default in play, clearing the grouping has
   * to record itself in the URL, because an absent `grouping` param is what the
   * loader reads as "apply the default" — so a cleared table would re-group on
   * the next navigation that writes any other param.
   */
  readonly hasDefaultGrouping?: boolean;
  /** Initial page size for first load */
  readonly initialPageSize: number;
  readonly isBordered: boolean;
  readonly isColumnSettingsOpen: boolean;
  readonly isColumnSettingsPinned: boolean;
  /**
   * Endpoint capability (ADR-063): the route's read can group rows server-side,
   * so the header menu offers group keys and the loader forwards them. Absent
   * means off — an endpoint that cannot group would be asked for a shape it
   * does not produce.
   */
  /**
   * Endpoint capability (ADR-063): the route serves a drilled page, so a leaf
   * group offers the affordance that fetches its rows (ADR-079). Absent means
   * off — a route with no drill endpoint would otherwise show a chevron whose
   * every use fails.
   */
  readonly isGroupDrillEnabled?: boolean;
  readonly isGroupingEnabled?: boolean;
  /**
   * The route's grouping is curated and the user may not reshape it (#578).
   * Locks the keys, the mode and the per-key granularity — the shape — while
   * leaving the aggregates editable, because a preset says how rows are grouped
   * rather than what is measured.
   *
   * Every surface that edits the shape reads this, not only the drawer: a lock
   * honoured in one place and ignored in another is not a lock.
   */
  readonly isGroupingLocked?: boolean;
  /**
   * Endpoint capability (ADR-063): the load-more sends the last loaded row as a
   * keyset cursor (ADR-052). Absent means off — an endpoint that cannot seek
   * would receive a parameter it ignores.
   */
  readonly isKeysetEnabled?: boolean;
  /** Round the table card's corners. Off by default — the table is square. */
  readonly isRounded: boolean;
  /**
   * Endpoint capability (ADR-063): the load-more sends the table's column
   * filters with each page. Absent means off — an endpoint that does not filter
   * server-side would append unfiltered rows to a filtered table.
   */
  readonly isServerFilterEnabled?: boolean;
  readonly isStriped: boolean;
  /**
   * This table shares its URL with another table's route, so it **reads** the
   * URL's filter/sort state as its starting floor but never writes back to it
   * (#870).
   *
   * The group-details modal is why it exists: it renders over the grouped list
   * as a child route, so both tables see one `?filters`. Without this the
   * modal's own filter drawer would overwrite the grouped view's filters —
   * which are the very state the modal inherited — and the list underneath
   * would be reconfigured by a change made in a dialog on top of it.
   *
   * Absent means off, so an ordinary table owns its URL exactly as before. What
   * a read-only table changes is durability, not capability: its own sort and
   * filters live in the store for the life of the dialog, and a refresh returns
   * to the inherited floor. Anything the URL must survive a refresh with
   * belongs in a param of its own — the modal keeps the group it opened in
   * `group`.
   */
  readonly isUrlStateReadOnly?: boolean;
  readonly isTableSettingsOpen: boolean;
  readonly isTableSettingsPinned: boolean;
  /** Page size for subsequent loads */
  readonly loadMorePageSize: number;
  /** Locale for formatting (defaults to navigator.language) */
  readonly locale?: string;
  readonly overscan: number;
  readonly persistenceKey: string;
  readonly placeholderRowCount: number;
  readonly rowHeight: number;
  readonly schemaName?: string;
  readonly tableName?: string;
  readonly tableSettingsExpandedFilters: readonly string[];
  readonly tableSettingsSelectedTab: string;
  readonly threshold: number;
  readonly title?: TableTitle;
  /**
   * Where a subtotal sits relative to the rows it totals (#578). Absent means
   * `last`, which is what the query builder already defaults to, so a route
   * that never offers the choice emits byte-identical SQL.
   *
   * It is a query setting, not a display one: the placement is emitted as the
   * direction of the `GROUPING()` term in the `ORDER BY`, so it reaches the
   * server rather than being applied to rows already fetched.
   */
  readonly totalsPlacement?: TableTotalsPlacement;
  readonly wasTableSettingsOpenBeforeColumnSettings?: boolean;
};

/**
 * Persistence configuration for table state slices
 */
export type TablePersistenceConfig = {
  /** Persist column filters */
  readonly columnFilters?: StorageType;
  /** Persist column order */
  readonly columnOrder?: StorageType;
  /** Persist column pinning */
  readonly columnPinning?: StorageType;
  /** Persist column sizing (custom widths) */
  readonly columnSizing?: StorageType;
  /** Persist column visibility */
  readonly columnVisibility?: StorageType;
  /** Persist sorting */
  readonly sorting?: StorageType;
};

/**
 * One persistence write handed to `usePersistTableStateAction`: a
 * `{ persistenceKey, slice, valueSlice }` state-slice write, a
 * `{ searchParamKey, searchParamValue }` URL write, or both. `TSlice`
 * narrows which persisted slices a given caller is allowed to touch.
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

/**
 * Slice-write variant of `TablePersistenceEntry` with the slice fields
 * required — the shape the column-state commit paths hand to
 * `persistTableState`.
 */
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
     * Reads why the endpoint returned no rows out of the response, when it said
     * so. It sits here rather than beside `dataSelector` on `InfiniteScroll`
     * because it is not part of the load-more contract: a load-more failure is
     * a rejected promise, while this is a **successful** response that carries
     * a refusal as data.
     *
     * Omit it and a refusal is indistinguishable from an empty result — which
     * is the failure mode this exists to close (#642).
     */
    readonly dataErrorSelector?: (
      response: TResponse,
    ) => TableResponseError | undefined;
    readonly isFlexWrapperEnabled?: boolean;
    readonly isLoading?: boolean;
    readonly response: TResponse;
  };

/**
 * Why a table read returned no rows, as **plain data** — the discriminated union
 * a loader may put in its payload in place of an error class.
 *
 * Duplicated from `@lcabrera/server`'s `SerializableDbError` for the reason
 * `TableAggregateFn` is (ADR-038/039), and pinned by the same contract test.
 *
 * A class cannot be used here even in principle: React Router single fetch drops
 * an object's prototype without a word, so `instanceof` on the client is always
 * false and `Error.message` — a non-enumerable own property — never arrives at
 * all (ADR-050, ADR-066). `kind` is what a component branches on instead.
 *
 * `message` is the endpoint's own vetted sentence. The Table renders it beside
 * its own heading rather than in place of one, because only the endpoint knows
 * *why* and only the Table knows what the user called the column.
 */
export type TableResponseError =
  | {
      /** The column the refusal is about, when exactly one is. */
      readonly column?: string;
      readonly estimatedRows?: number;
      readonly kind: 'grouping-refused';
      readonly message: string;
      readonly reason: TableGroupingRefusalReason;
    }
  | {
      /** The raw SQLSTATE, when the endpoint supplied one. Never the message. */
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

/**
 * Where a subtotal sits relative to the rows it totals.
 *
 * The same two tokens `@lcabrera/server`'s `GroupQueryDescriptor` spells as
 * `subtotalPlacement`, and deliberately the same shape rather than a shared
 * import: this package is client-safe and may not depend on the Node-only one
 * (ADR-038, ADR-039). The contract test is what holds the two spellings
 * together.
 */
export type TableTotalsPlacement = 'first' | 'last';

type BaseProps = ComponentPropsWithRef<'table'> & {
  readonly actions?: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
};

/**
 * The half of a grouping capability that does not depend on whether the column
 * is groupable — the client-side twin of the server's `ColumnCapabilityShared`.
 */
type TableColumnCapabilityShared = {
  readonly aggregates: readonly TableAggregateFn[];
  readonly column: string;
  /** Resolved distinct-value estimate; absent when statistics are unavailable. */
  readonly distinctEstimate?: number;
  /**
   * The granularities this column may be grouped at, empty for anything that is
   * not a date or a timestamp.
   *
   * **Read it instead of `canGroup`, not after it.** A date column is normally
   * refused as a raw key — one group per calendar day is exactly the tree the
   * cardinality guard exists to refuse — while `month` and above clear the same
   * guard comfortably. So a refused column routinely carries a non-empty list,
   * and a surface gating on `canGroup` alone hides the one dimension every
   * report is organised by (#786).
   */
  readonly periods: readonly TableGroupPeriod[];
  readonly role: TableColumnAnalyticalRole;
  readonly typeName: string;
};
