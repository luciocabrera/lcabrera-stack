import type { SettingsDraft } from '../Settings.types';

export type PinningSettingsTabProps = {
  readonly draft: SettingsDraft;
  readonly onOrderConflictChange: (
    value: SettingsDraft['orderConflictResolution'],
  ) => void;
  readonly onPinConflictChange: (
    value: SettingsDraft['pinConflictResolution'],
  ) => void;
  readonly onPinSideChange: (value: SettingsDraft['pinSide']) => void;
  readonly onUnpinConflictChange: (
    value: SettingsDraft['unpinConflictResolution'],
  ) => void;
};
