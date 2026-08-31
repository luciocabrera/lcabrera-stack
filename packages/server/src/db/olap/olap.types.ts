import type { GroupKeyPeriod } from '../group-query-builder/group-query-builder.types';
import type {
  QueryFilter,
  QuerySort,
} from '../query-builder/query-builder.types';

export type GroupKeyTruncation = {
  readonly isZoned: boolean;
  readonly period: GroupKeyPeriod;
};

export type GroupRestriction = {
  readonly columnKey: string;
  readonly label: string;
  readonly value: string;
};

export type GroupRestrictionStatement = {
  readonly entries: readonly GroupRestriction[];
  readonly refusal?: string;
};

export type OlapDrillRead = {
  readonly filters: readonly QueryFilter[];
  readonly includeTotal: boolean;
  readonly limit: number;
  readonly offset: number;
  readonly sort: readonly QuerySort[];
};

export type OlapDrillRefusal = 'grand-total' | 'incomplete-path' | 'subtotal';

export type OlapDrillTranslation =
  | { readonly kind: 'drillable'; readonly read: OlapDrillRead }
  | { readonly kind: 'refused'; readonly reason: OlapDrillRefusal };

export type OlapGroupRead = OlapDrillRead & {
  readonly cursor?: readonly unknown[];
};

export type OlapGroupReadRefusal = 'absent' | 'malformed' | OlapDrillRefusal;

export type OlapGroupReadResolution =
  | { readonly kind: 'read'; readonly read: OlapGroupRead }
  | {
      readonly kind: 'refused';
      readonly message: string;
      readonly reason: OlapGroupReadRefusal;
    };
