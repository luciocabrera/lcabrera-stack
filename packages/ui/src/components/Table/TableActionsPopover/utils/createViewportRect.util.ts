import type { BoundsRect } from '../TableActionsPopover.types';

type CreateViewportRectArgs = {
  readonly height: number;
  readonly width: number;
};

/**
 * Builds a whole-viewport BoundsRect from the given window dimensions — the
 * fallback container bounds used while the table container ref is unmounted.
 */
export const createViewportRect = ({ height, width }: CreateViewportRectArgs) =>
  ({
    bottom: height,
    height,
    left: 0,
    right: width,
    top: 0,
    width,
  }) satisfies BoundsRect;
