import type {
  TableGroupFold,
  TableGroupingMode,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import type {
  OrderConflictResolution,
  UnpinConflictResolution,
} from './pinningPreferences.types';
import type { PinConflictResolution, PinSide } from './ui.types';

/**
 * Each member is absent when it equals the shipped default, so a settings cookie
 * carries only what the user actually moved away from.
 */
export type GlobalGroupingPreferences = {
  readonly defaultFold?: TableGroupFold;
  readonly mode?: TableGroupingMode;
  readonly totalsPlacement?: TableTotalsPlacement;
};

export type GlobalNavigationCollapsedPreference = 'collapsed' | 'expanded';

export type GlobalNavigationPreferences = {
  readonly collapsed?: GlobalNavigationCollapsedPreference;
  readonly size?: GlobalNavigationSizePreference;
};

export type GlobalNavigationSizePreference =
  | 'compact'
  | 'large'
  | 'medium'
  | 'small';

export type GlobalPinningPreferences = {
  readonly orderConflictResolution?: OrderConflictResolution;
  readonly pinConflictResolution?: PinConflictResolution;
  readonly pinSide?: PinSide;
  readonly unpinConflictResolution?: UnpinConflictResolution;
};

export type GlobalSettingsState = {
  readonly grouping: GlobalGroupingPreferences;
  readonly navigation: GlobalNavigationPreferences;
  readonly pinning: GlobalPinningPreferences;
};
