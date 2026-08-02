import type { VirtualSelectMetaState } from '../../VirtualSelect.types';

type GetInitialSelectMetaStateArgs = Omit<
  VirtualSelectMetaState,
  'isListVisible'
>;

/**
 * Builds the meta-store state from the grouped `metaState` props, with the
 * derived `isListVisible` pre-computed (never derived in selectors). Fields
 * are picked explicitly so extra keys on the args (the shell's
 * `onCloseDropdown`/`onToggleDropdown` callbacks) never leak into the store
 * state.
 */
export const getInitialSelectMetaState = ({
  customStylex,
  isAlwaysOpen,
  isBusy,
  isOpen,
  listboxId,
  mode,
  placeholder,
}: GetInitialSelectMetaStateArgs) => {
  const state: VirtualSelectMetaState = {
    customStylex,
    isAlwaysOpen,
    isBusy,
    isListVisible: isAlwaysOpen || isOpen,
    isOpen,
    listboxId,
    mode,
    placeholder,
  };

  return state;
};
