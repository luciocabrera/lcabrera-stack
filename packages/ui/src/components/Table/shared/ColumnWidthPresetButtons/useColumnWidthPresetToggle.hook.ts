import { useState } from 'react';

import type { WidthPreset } from './ColumnWidthPresetButtons.types';

type UseColumnWidthPresetToggleArgs = {
  readonly onSelectPreset: (preset: NonNullable<WidthPreset>) => void;
};

/**
 * Owns the min/max/default width-preset toggle state shared by the per-column
 * (GeneralSectionHeader) and all-columns (ColumnWidthsSection) width sections:
 * tracks the selected preset and exposes the three bound toggle handlers.
 * Selecting a preset invokes `onSelectPreset`; re-selecting the active preset
 * deselects it and reverts to the current state (no write).
 */
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
