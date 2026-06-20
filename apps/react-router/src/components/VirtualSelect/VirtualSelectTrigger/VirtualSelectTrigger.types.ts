import type { RefObject } from 'react';

import type { VirtualSelectMode } from '../VirtualSelect.types';

export type VirtualSelectTriggerProps = {
  readonly isAlwaysOpen: boolean;
  readonly isBusy?: boolean;
  readonly isOpen: boolean;
  readonly listboxId: string;
  readonly mode: VirtualSelectMode;
  readonly onRemoveTag: (option: string) => void;
  readonly onToggle: () => void;
  readonly overflowCount: number;
  readonly placeholder: string;
  readonly selected: readonly string[];
  readonly triggerRef: RefObject<HTMLButtonElement | HTMLDivElement | null>;
  readonly visibleTags: readonly string[];
};
