import type { VirtualSelectContextValue } from './VirtualSelectContext.types';

import { useVirtualSelectContextValue } from './useVirtualSelectContextValue.hook';

export const useVirtualSelectAnchorRef =
  (): VirtualSelectContextValue['anchorRef'] =>
    useVirtualSelectContextValue().anchorRef;
