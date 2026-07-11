import type {
  DesignSystemOrientation,
  DesignSystemSize,
} from '@repo/ui/types/design-system.types';

import type { ToolbarItemConfig } from '../Toolbar.types';

export type ToolbarItemProps = {
  readonly isCompact: boolean;
  readonly item: ToolbarItemConfig;
  readonly orientation: DesignSystemOrientation;
  readonly size: DesignSystemSize;
};
