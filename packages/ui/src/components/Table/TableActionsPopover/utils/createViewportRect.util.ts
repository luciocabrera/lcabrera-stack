import type { BoundsRect } from '../TableActionsPopover.types';

type CreateViewportRectArgs = {
  readonly height: number;
  readonly width: number;
};

export const createViewportRect = ({ height, width }: CreateViewportRectArgs) =>
  ({
    bottom: height,
    height,
    left: 0,
    right: width,
    top: 0,
    width,
  }) satisfies BoundsRect;
