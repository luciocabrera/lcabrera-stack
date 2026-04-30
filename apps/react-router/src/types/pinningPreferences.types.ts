import type { PinSide } from './ui.types';

export type PinConflictResolution =
  | 'move-column'
  | 'pin-all-between'
  | 'pin-only';

export type PinSidePreferenceOption = PinSide | 'always-ask';

export type PinConflictResolutionPreferenceOption =
  | PinConflictResolution
  | 'always-ask';

export type UnpinConflictResolution = 'reorder-to-fill' | 'unpin-beyond';

export type UnpinConflictResolutionPreferenceOption =
  | UnpinConflictResolution
  | 'always-ask';
