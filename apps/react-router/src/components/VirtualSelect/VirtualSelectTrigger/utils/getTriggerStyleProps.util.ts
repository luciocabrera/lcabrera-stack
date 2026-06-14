import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger.types';

import { styles } from '../VirtualSelectTrigger.stylex';

type GetTriggerStylePropsArgs = {
  isOpen: boolean;
  mode: VirtualSelectTriggerProps['mode'];
  isStatic?: boolean;
};

export const getTriggerStyleProps = ({
  isOpen,
  mode,
  isStatic = false,
}: GetTriggerStylePropsArgs) =>
  stylex.props(
    styles.trigger,
    isOpen && styles.triggerOpen,
    mode === 'multi' && styles.triggerClamped,
    isStatic && styles.triggerStatic,
  );
