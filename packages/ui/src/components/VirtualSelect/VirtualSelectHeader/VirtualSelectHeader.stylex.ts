import { zIndex } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { skeleton } from '@lcabrera/ui/design-system/tokens/commons.stylex';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  busyOverlay: {
    insetBlock: 0,
    insetInline: 0,
    zIndex: zIndex.popover,
  },
});

export const busyStyles = {
  overlay: [skeleton.loadingOverlay, styles.busyOverlay],
  wave: skeleton.shimmerWave,
};
