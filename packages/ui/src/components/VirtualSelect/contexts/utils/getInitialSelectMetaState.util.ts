import type { VirtualSelectMetaState } from '../../VirtualSelect.types';

type GetInitialSelectMetaStateArgs = Omit<
  VirtualSelectMetaState,
  'isListVisible'
>;

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
