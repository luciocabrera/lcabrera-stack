import type { VirtualSelectMetaState } from '../../../VirtualSelect.types';

type GetInitialSelectMetaStateArgs = Omit<
  VirtualSelectMetaState,
  'isListVisible'
>;

/**
 * Builds the meta-store state from the VirtualSelect shell props, with the
 * derived `isListVisible` pre-computed (never derived in selectors).
 */
export const getInitialSelectMetaState = (
  args: GetInitialSelectMetaStateArgs,
) => {
  const state: VirtualSelectMetaState = {
    ...args,
    isListVisible: args.isAlwaysOpen || args.isOpen,
  };

  return state;
};
