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

export type DataKey<TData> = 'actions' | (keyof TData & string);

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
 * The grouping store's state — the config context's third store (ADR-061).
 *
 * Only the applied keys today. It is a store rather than a field on the columns
 * store because expansion joins it here next, and expansion must survive the
 * data context being re-created on every navigation.
 */
export type TableGroupingState = {
  readonly keys: readonly string[];
};

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
 * `label` is already formatted, because formatting a key value needs the
 * column's `dataType` and locale, both of which the row does not carry.
 */
export type TableGroupRowSummary = {
  /** The column the rows are grouped by. */
  readonly columnKey: string;
  /** How many rows the group aggregates. */
  readonly count: number;
  /** The group's key value, formatted for display. */
  readonly label: string;
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
   * The group keys the loader actually applied, read from the `grouping` search
   * param and sanitized against this route's columns (ADR-061). It seeds the
   * grouping store; the store is the live value from then on, exactly as
   * `columnsState.sorting` seeds the columns store.
   *
   * Empty whenever grouping is off, refused, or unsupported by the route — so
   * "is this table grouped" is one question with one answer.
   */
  readonly groupingKeys?: readonly string[];
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
  readonly isGroupingEnabled?: boolean;
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
    readonly isFlexWrapperEnabled?: boolean;
    readonly isLoading?: boolean;
    readonly response: TResponse;
  };

export type TableTitle = {
  readonly plural: string;
  readonly singular: string;
};

type BaseProps = ComponentPropsWithRef<'table'> & {
  readonly actions?: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
};
