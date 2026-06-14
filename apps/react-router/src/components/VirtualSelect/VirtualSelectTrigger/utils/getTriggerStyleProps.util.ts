import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger.types';

import { styles } from '../VirtualSelectTrigger.stylex';

export const getTriggerStyleProps = (
  isOpen: boolean,
  mode: VirtualSelectTriggerProps['mode'],
  isStatic = false,
) =>
  stylex.props(
    styles.trigger,
    isOpen && styles.triggerOpen,
    mode === 'multi' && styles.triggerClamped,
    isStatic && styles.triggerStatic,
  );
