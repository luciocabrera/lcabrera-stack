import type { RefObject } from 'react';

import type { VirtualListProviderProps } from '#ui/components/VirtualList/contexts/VirtualListContext.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import type { VirtualSelectMetaState } from '../VirtualSelect.types';

export type VirtualSelectContextValue = {
  /** The shell's outer container — the rect a floating dropdown anchors to. A ref, not store state: it never triggers a render. */
  readonly anchorRef: RefObject<HTMLDivElement | null>;
  readonly metaStore: TStore<VirtualSelectMetaState>;
  readonly onCloseDropdown: () => void;
  readonly onToggleDropdown: () => void;
};

export type VirtualSelectMetaStateProps = Omit<
  VirtualSelectMetaState,
  'isListVisible'
> & {
  readonly onCloseDropdown: () => void;
  readonly onToggleDropdown: () => void;
};

export type VirtualSelectProviderProps = VirtualListProviderProps & {
  readonly anchorRef: VirtualSelectContextValue['anchorRef'];
  readonly metaState: VirtualSelectMetaStateProps;
};
