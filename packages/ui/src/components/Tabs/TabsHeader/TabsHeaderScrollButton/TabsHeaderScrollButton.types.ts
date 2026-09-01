import type { TabsScrollDirection } from '../TabsHeader.types';

export type TabsHeaderScrollButtonProps = {
  readonly direction: TabsScrollDirection;
  readonly onScroll: (direction: TabsScrollDirection) => void;
};
