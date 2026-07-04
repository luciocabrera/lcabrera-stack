import type { PinConflictResolution, PinSide } from './ui.types';

export type OrderConflictResolution =
  | 'pin-to-match-order'
  | 'remove-conflicting-pins'
  | 'reset-all-pins';

export type OrderConflictResolutionPreferenceOption =
  | 'always-ask'
  | OrderConflictResolution;

export type PinConflictResolutionPreferenceOption =
  | 'always-ask'
  | PinConflictResolution;

export type PinSidePreferenceOption = 'always-ask' | PinSide;

export type UnpinConflictResolution = 'reorder-to-fill' | 'unpin-beyond';

export type UnpinConflictResolutionPreferenceOption =
  | 'always-ask'
  | UnpinConflictResolution;
