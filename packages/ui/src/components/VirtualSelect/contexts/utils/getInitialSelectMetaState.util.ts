import type { VirtualSelectMetaState } from '../../VirtualSelect.types';

type GetInitialSelectMetaStateArgs = Omit<
  VirtualSelectMetaState,
  'isListVisible' | 'placement'
> &
  Partial<Pick<VirtualSelectMetaState, 'placement'>>;

export const getInitialSelectMetaState = ({
  attachedEdge,
  customStylex,
  isAlwaysOpen,
  isBusy,
  isDisabled,
  isOpen,
  labelId,
  listboxId,
  mode,
  placeholder,
  placement = 'auto',
}: GetInitialSelectMetaStateArgs) => {
  const state: VirtualSelectMetaState = {
    attachedEdge,
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
    placement,
  };

  return state;
};
