import type { RefObject } from 'react';

import type { VirtualSelectMode } from '../VirtualSelect.types';

export type VirtualSelectTriggerProps = {
  readonly isAlwaysOpen: boolean;
  readonly isOpen: boolean;
  readonly mode: VirtualSelectMode;
  readonly onRemoveTag: (option: string) => void;
  readonly onToggle: () => void;
  readonly overflowCount: number;
  readonly placeholder: string;
  readonly selected: string[];
  readonly triggerRef: RefObject<HTMLDivElement | null>;
  readonly visibleTags: string[];
};
