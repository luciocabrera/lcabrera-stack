import type { MenuPosition } from '../TableActionsPopover.types';
import type { ResolveOpenMenuRepositionResult } from './resolveOpenMenuReposition.util';

type ApplyRepositionOutcomeArgs = {
  readonly closeMenu: () => void;
  readonly outcome: ResolveOpenMenuRepositionResult;
  readonly setMenuPosition: (position: MenuPosition) => void;
};

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
