import type { VirtualSelectContextValue } from './VirtualSelectContext.types';

import { useVirtualSelectContextValue } from './useVirtualSelectContextValue.hook';

/**
 * The shell container a floating dropdown measures itself against. Mirrors
 * `useTableContainerRef`: a ref is infrastructure, not store state, so it is
 * read straight off the context value rather than through a meta selector.
 */
export const useVirtualSelectAnchorRef =
  (): VirtualSelectContextValue['anchorRef'] =>
    useVirtualSelectContextValue().anchorRef;
