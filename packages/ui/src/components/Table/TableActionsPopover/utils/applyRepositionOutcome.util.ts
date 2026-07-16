import type { MenuPosition } from '../TableActionsPopover.types';
import type { ResolveOpenMenuRepositionResult } from './resolveOpenMenuReposition.util';

type ApplyRepositionOutcomeArgs = {
  readonly closeMenu: () => void;
  readonly outcome: ResolveOpenMenuRepositionResult;
  readonly setMenuPosition: (position: MenuPosition) => void;
};

/**
 * Applies a resolveOpenMenuReposition outcome to the injected popover state:
 * `close` closes the menu, `reposition` stores the fresh coordinates, `keep`
 * leaves everything untouched. Returns whether the menu repositioned (i.e. is
 * still open), so RAF stabilization loops know to schedule another frame.
 */
export const applyRepositionOutcome = ({
  closeMenu,
  outcome,
  setMenuPosition,
}: ApplyRepositionOutcomeArgs) => {
  if (outcome.kind === 'close') {
    closeMenu();

    return false;
  }

  if (outcome.kind === 'reposition') {
    setMenuPosition(outcome.position);

    return true;
  }

  return false;
};
