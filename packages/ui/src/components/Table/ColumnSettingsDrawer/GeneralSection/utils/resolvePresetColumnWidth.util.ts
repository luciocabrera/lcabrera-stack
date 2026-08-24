import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

type ResolvePresetColumnWidthArgs = {
  readonly maxWidth?: number;
  readonly minWidth?: number;
  readonly preset: 'default' | 'max' | 'min';
};

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
