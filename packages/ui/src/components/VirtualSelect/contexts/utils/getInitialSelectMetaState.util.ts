import type { VirtualSelectMetaState } from '../../VirtualSelect.types';

type GetInitialSelectMetaStateArgs = Omit<
  VirtualSelectMetaState,
  'isListVisible'
>;

export const getInitialSelectMetaState = ({
  customStylex,
  isAlwaysOpen,
  isBusy,
  isDisabled,
  isOpen,
  labelId,
  listboxId,
  mode,
  placeholder,
}: GetInitialSelectMetaStateArgs) => {
  const state: VirtualSelectMetaState = {
    customStylex,
    isAlwaysOpen,
    isBusy,
    isDisabled,
    isListVisible: isAlwaysOpen || isOpen,
    isOpen,
    labelId,
    listboxId,
    mode,
    placeholder,
  };

  return state;
};
