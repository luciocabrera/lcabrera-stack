import type {
  OrderConflictResolution,
  PinConflictResolution,
  UnpinConflictResolution,
} from './pinningPreferences.types';
import type { PinSide } from './ui.types';

export type GlobalNavigationSizePreference =
  | 'compact'
  | 'large'
  | 'medium'
  | 'small';

export type GlobalNavigationCollapsedPreference = 'collapsed' | 'expanded';

export type GlobalNavigationPinnedPreference = 'pinned' | 'unpinned';

export type GlobalNavigationPreferences = {
  readonly collapsed?: GlobalNavigationCollapsedPreference;
  readonly pinned?: GlobalNavigationPinnedPreference;
  readonly size?: GlobalNavigationSizePreference;
};

export type GlobalPinningPreferences = {
  readonly orderConflictResolution?: OrderConflictResolution;
  readonly pinConflictResolution?: PinConflictResolution;
  readonly pinSide?: PinSide;
  readonly unpinConflictResolution?: UnpinConflictResolution;
};

export type GlobalSettingsState = {
  readonly navigation: GlobalNavigationPreferences;
  readonly pinning: GlobalPinningPreferences;
};
