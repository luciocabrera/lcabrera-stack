import type { VirtualSelectMetaState } from '../VirtualSelect.types';

export const INITIAL_SELECT_META_STATE: VirtualSelectMetaState = {
  isAlwaysOpen: false,
  isBusy: false,
  isListVisible: false,
  isOpen: false,
  listboxId: '',
  mode: 'single',
  placeholder: 'Select...',
};
