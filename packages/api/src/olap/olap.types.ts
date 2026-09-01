export type OlapDrillGroup = {
  readonly isSubtotal: boolean;
  readonly path: readonly OlapGroupPathEntry[];
};

export type OlapDrillRequest = {
  readonly group: OlapDrillGroup;
  readonly groupKeys: readonly string[];
  /** Granularity each temporal key was grouped at, by column. */
  readonly periods?: Readonly<Record<string, OlapGroupPeriod>>;
};

export type OlapGroupPathEntry = {
  readonly columnKey: string;
  readonly value: unknown;
};

export type OlapGroupPeriod = 'day' | 'month' | 'quarter' | 'year';
