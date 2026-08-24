import { useState } from 'react';

import type { WidthPreset } from './ColumnWidthPresetButtons.types';

type UseColumnWidthPresetToggleArgs = {
  readonly onSelectPreset: (preset: NonNullable<WidthPreset>) => void;
};

export const useColumnWidthPresetToggle = ({
  onSelectPreset,
}: UseColumnWidthPresetToggleArgs) => {
  const [selectedPreset, setSelectedPreset] = useState<WidthPreset>();

  const handleToggle = (preset: NonNullable<WidthPreset>) => {
    const newPreset = selectedPreset === preset ? undefined : preset;
    setSelectedPreset(newPreset);

    if (newPreset === undefined) {
      // Deselected — revert to current state (no write).
      return;
    }

    onSelectPreset(newPreset);
  };

  return {
    handleToggleDefault: () => handleToggle('default'),
    handleToggleMax: () => handleToggle('max'),
    handleToggleMin: () => handleToggle('min'),
    selectedPreset,
  };
};
