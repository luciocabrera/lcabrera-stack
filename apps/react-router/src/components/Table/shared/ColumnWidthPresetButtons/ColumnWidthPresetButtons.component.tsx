import { Button } from '@/components/Button';
import { MaximizeIcon, MinimizeIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants';

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
      color={selectedPreset === 'min' ? 'primary' : 'outline'}
      disabled={isMinDisabled}
      icon={<MinimizeIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={onToggleMin}
      size='sm'
      width='full'
    >
      {minLabel}
    </Button>
    <Button
      color={selectedPreset === 'max' ? 'primary' : 'outline'}
      disabled={isMaxDisabled}
      icon={<MaximizeIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={onToggleMax}
      size='sm'
      width='full'
    >
      {maxLabel}
    </Button>
    <Button
      color={selectedPreset === 'default' ? 'primary' : 'outline'}
      icon={<RefreshIcon size={ICON_SIZE_MD} />}
      isBusy={isBusy}
      onClick={onToggleDefault}
      size='sm'
      width='full'
    >
      {defaultLabel}
    </Button>
  </>
);
