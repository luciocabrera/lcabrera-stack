import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectMode } from '../../VirtualSelect.types';

import { styles } from '../VirtualSelectTrigger.stylex';

type GetTriggerStylePropsArgs = {
  isInert?: boolean;
  isOpen: boolean;
  isStatic?: boolean;
  mode: VirtualSelectMode;
};

export const getTriggerStyleProps = ({
  isInert = false,
  isOpen,
  isStatic = false,
  mode,
}: GetTriggerStylePropsArgs) =>
  stylex.props(
    styles.trigger,
    isInert && styles.triggerBusy,
    isOpen && styles.triggerOpen,
    mode === 'multi' && styles.triggerClamped,
    isStatic && styles.triggerStatic,
  );
