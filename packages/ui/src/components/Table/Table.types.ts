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

export type ColumnVisibilityState<TData = Record<string, unknown>> = Set<
  DataKey<TData>
>;

export type DataKey<TData> =
  | 'actions'
  | AggregateColumnKey
  | (keyof TData & string);

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

export type FilterOptionsDescriptor =
  | DistinctFilterOptionsDescriptor
  | StaticFilterOptionsDescriptor;

export type FilterOptionsResponse = {
  readonly hasMore: boolean;
  readonly values: string[];
};

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

export type TableAggregateFn =
  | 'avg'
  | 'boolAnd'
  | 'boolOr'
  | 'count'
  | 'countDistinct'
  | 'max'
  | 'min'
  | 'sum';

export type TableColumn<TData> = {
  readonly dataType?: TableColumnDataType;
  readonly filterOptionsDescriptor?: FilterOptionsDescriptor;
  readonly format?: TableColumnFormat;
  readonly headerGroupLabel?: string;
  readonly isFilterable?: boolean;
  readonly isGroupable?: boolean;
  readonly isHeaderHidden?: boolean;
  readonly isPrimaryKey?: boolean;
  readonly isResizable?: boolean;
  readonly isSortable?: boolean;
  readonly isStatic?: boolean;
  readonly key: DataKey<TData>;
  readonly label: string;
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly render?: (row: TData) => ReactNode;
};

export type TableColumnAggregate = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};

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

export type TableColumnsStateInput<TData = Record<string, unknown>> = Omit<
  TableColumnsState<TData>,
  | 'effectiveColumns'
  | 'normalizedColumns'
  | 'pinnedColumnOffsets'
  | 'pinnedColumnPartition'
  | 'staticKeys'
>;

export type TableCrudConfig = {
  readonly create?: boolean;
  readonly delete?: boolean;
  readonly read?: boolean;
  readonly update?: boolean;
};

export type TableDataState<TData> = {
  readonly data: readonly TData[];
  readonly error: TableResponseError | undefined;
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly totalLoadedRows: number;
  readonly totalRows: number;
};

export type TableDensity = 'comfortable' | 'compact';

export type TableFocusState = {
  readonly columnKey: string | undefined;
  readonly focusRequestId: number;
  readonly isGridFocused: boolean;
  readonly rowIndex: number | undefined;
  readonly rowKey: string | undefined;
};

export type TableGroupAggregateValue = {
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
  readonly value: unknown;
};

export type TableGroupExpansionState = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
};

export type TableGroupingMode = 'flat' | 'rollup';

export type TableGroupingRefusalReason =
  | 'aggregate-not-legal'
  | 'column-not-groupable'
  | 'duplicate-keys'
  | 'estimate-too-large'
  | 'no-keys'
  | 'row-limit-reached'
  | 'too-many-keys'
  | 'unknown-column';

export type TableGroupingState = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly keys: readonly string[];
  readonly mode: TableGroupingMode;
  readonly periods: Readonly<Record<string, TableGroupPeriod>>;
  readonly shares: readonly TableColumnAggregate[];
};

export type TableGroupKeyRefusalReason =
  | 'no-equality-operator'
  | 'not-a-dimension'
  | 'stats-unavailable'
  | 'too-many-distinct'
  | 'unique-ish';

export type TableGroupKeyValue = {
  readonly columnKey: string;
  readonly label: string;
  readonly value: unknown;
};

export type TableGroupPeriod = OlapGroupPeriod;

export type TableGroupRow = Record<'tableGroup', TableGroupRowSummary>;

export type TableGroupRowSummary = {
  readonly aggregates: readonly TableGroupAggregateValue[];
  readonly count: number;
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
  readonly appId?: string;
  readonly columnSelectedKey?: string;
  readonly columnSettingsSelectedTab: string;
  readonly crud?: TableCrudConfig;
  readonly deleteActionPath?: string;
  readonly density: TableDensity;
  readonly drawersSyncNonce?: number;
  readonly enablePrefetch: boolean;
  readonly error?: string;
  readonly groupDetailsPath?: string;
  readonly groupingAggregates?: readonly TableColumnAggregate[];
  readonly groupingCapabilities?: Readonly<
    Record<string, TableColumnGroupingCapability>
  >;
  readonly groupingKeys?: readonly string[];
  readonly groupingMode?: TableGroupingMode;
  readonly groupingPeriods?: Readonly<Record<string, TableGroupPeriod>>;
  readonly groupingShares?: readonly TableColumnAggregate[];
  readonly hasDefaultGrouping?: boolean;
  readonly initialPageSize: number;
  readonly isBordered: boolean;
  readonly isColumnLayoutTransient?: boolean;
  readonly isColumnSettingsOpen: boolean;
  readonly isColumnSettingsPinned: boolean;
  readonly isGroupingEnabled?: boolean;
  readonly isGroupingLocked?: boolean;
  readonly isKeysetEnabled?: boolean;
  readonly isRounded: boolean;
  readonly isServerFilterEnabled?: boolean;
  readonly isStriped: boolean;
  readonly isTableSettingsOpen: boolean;
  readonly isTableSettingsPinned: boolean;
  readonly isUrlStateNested?: boolean;
  readonly loadMorePageSize: number;
  readonly locale?: string;
  readonly lockedFilters?: TableLockedFilters;
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
    readonly dataErrorSelector?: (
      response: TResponse,
    ) => TableResponseError | undefined;
    readonly isFlexWrapperEnabled?: boolean;
    readonly isLoading?: boolean;
    readonly response: TResponse;
  };

export type TableResponseError =
  | {
      readonly code?: string;
      readonly kind: 'db-failed';
      readonly message: string;
    }
  | {
      readonly column?: string;
      readonly estimatedRows?: number;
      readonly kind: 'grouping-refused';
      readonly message: string;
      readonly reason: TableGroupingRefusalReason;
    }
  | { readonly kind: 'db-canceled'; readonly message: string }
  | { readonly kind: 'unexpected'; readonly message: string };

export type TableTitle = {
  readonly plural: string;
  readonly singular: string;
};

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
  readonly periods: readonly TableGroupPeriod[];
  readonly role: TableColumnAnalyticalRole;
  readonly typeName: string;
};
