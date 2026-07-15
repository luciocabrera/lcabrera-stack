import { Button } from '@repo/ui/components/Button';
import {
  MaximizeIcon,
  MinimizeIcon,
  RefreshIcon,
} from '@repo/ui/components/Icons';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';

import type { ColumnWidthPresetButtonsProps } from './ColumnWidthPresetButtons.types';

export const ColumnWidthPresetButtons = ({
  defaultLabel = 'Reset to Default Width',
  isBusy = false,
  isMaxDisabled = false,
  isMinDisabled = false,
  maxLabel = 'Set to Max Width',
  minLabel = 'Set to Min Width',
  onToggleDefault,
  onToggleMax,
  onToggleMin,
  selectedPreset,
}: ColumnWidthPresetButtonsProps) => (
  <>
    <Button
      disabled={isMinDisabled}
      icon={<MinimizeIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={onToggleMin}
      size='sm'
      variant={selectedPreset === 'min' ? 'primary' : 'outline'}
    >
      {minLabel}
    </Button>
    <Button
      disabled={isMaxDisabled}
      icon={<MaximizeIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={onToggleMax}
      size='sm'
      variant={selectedPreset === 'max' ? 'primary' : 'outline'}
    >
      {maxLabel}
    </Button>
    <Button
      icon={<RefreshIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={onToggleDefault}
      size='sm'
      variant={selectedPreset === 'default' ? 'primary' : 'outline'}
    >
      {defaultLabel}
    </Button>
  </>
);
