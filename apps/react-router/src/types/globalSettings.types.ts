import type {
  PinConflictResolution,
  UnpinConflictResolution,
} from './pinningPreferences.types';
import type { PinSide } from './ui.types';

export type GlobalPinningPreferences = {
  readonly pinConflictResolution?: PinConflictResolution;
  readonly pinSide?: PinSide;
  readonly unpinConflictResolution?: UnpinConflictResolution;
};

export type GlobalSettingsState = {
  readonly pinning: GlobalPinningPreferences;
};
