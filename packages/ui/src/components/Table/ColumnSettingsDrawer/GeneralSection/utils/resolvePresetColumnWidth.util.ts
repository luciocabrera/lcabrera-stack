import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

type ResolvePresetColumnWidthArgs = {
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly preset: 'default' | 'max' | 'min';
};

/**
 * Map a width preset to the sizing value written to the column drawer store:
 * the column's configured bound (falling back to the default minimum width)
 * for min/max, or `undefined` for the default preset, which clears the
 * custom sizing.
 */
export const resolvePresetColumnWidth = ({
  maxWidth,
  minWidth,
  preset,
}: ResolvePresetColumnWidthArgs) => {
  switch (preset) {
    case 'default': {
      return;
    }
    case 'max': {
      return maxWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
    }
    case 'min': {
      return minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;
    }
  }
};
