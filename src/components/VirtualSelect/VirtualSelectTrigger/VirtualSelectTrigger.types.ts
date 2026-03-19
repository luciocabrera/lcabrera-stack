import type { RefObject } from 'react';

import type { VirtualSelectMode } from '../VirtualSelect.types';

export type VirtualSelectTriggerProps = {
  isAlwaysOpen: boolean;
  isOpen: boolean;
  mode: VirtualSelectMode;
  onRemoveTag: (option: string) => void;
  onToggle: () => void;
  overflowCount: number;
  placeholder: string;
  selected: string[];
  triggerRef: RefObject<HTMLDivElement | null>;
  visibleTags: string[];
};
