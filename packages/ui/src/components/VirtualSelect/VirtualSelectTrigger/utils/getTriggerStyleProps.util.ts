import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectAttachedEdge } from '../../VirtualSelect.types';

import { styles } from '../VirtualSelectTrigger.stylex';

type GetTriggerStylePropsArgs = {
  readonly attachedEdge?: VirtualSelectAttachedEdge;
  readonly hasTags?: boolean;
  readonly isAttachedBelow?: boolean;
  readonly isInert?: boolean;
  readonly isOpen: boolean;
  readonly isStatic?: boolean;
};

export const getTriggerStyleProps = ({
  attachedEdge,
  hasTags = false,
  isAttachedBelow = false,
  isInert = false,
  isOpen,
  isStatic = false,
}: GetTriggerStylePropsArgs) =>
  stylex.props(
    styles.trigger,
    isInert && styles.triggerBusy,
    isOpen && styles.triggerOpen,
    ((isOpen && isAttachedBelow) || attachedEdge === 'bottom') &&
      styles.triggerAttachedBelow,
    hasTags && styles.triggerClamped,
    isStatic && styles.triggerStatic,
    attachedEdge === 'top' && styles.triggerAttachedAbove,
  );
