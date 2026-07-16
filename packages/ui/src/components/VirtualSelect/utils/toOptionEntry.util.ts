import type { VirtualSelectOption } from '../VirtualSelect.types';

export const toOptionEntry = (option: string | VirtualSelectOption) =>
  typeof option === 'string' ? { label: option, value: option } : option;
