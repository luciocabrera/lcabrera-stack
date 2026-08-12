import * as stylex from '@stylexjs/stylex';

import { borderRadius } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  overlay: {
    inset: 0,
    borderRadius: borderRadius.md,
    backdropFilter: 'blur(4px) saturate(85%)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    position: 'absolute',
    zIndex: 1,
  },
  restArea: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minHeight: 0,
  },
  restAreaOverflowHidden: {
    overflow: 'hidden',
  },
});
