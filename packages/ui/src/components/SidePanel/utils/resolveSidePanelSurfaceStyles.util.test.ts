import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import type { SidePanelPosition, SidePanelSize } from '../SidePanel.types';

import {
  SIDE_PANEL_MAX_WIDTH_RATIO,
  SIDE_PANEL_MIN_WIDTH,
} from '../SidePanel.constants';
import { sidePanelStyles } from '../SidePanel.stylex';
import { resolveSidePanelSurfaceStyles } from './resolveSidePanelSurfaceStyles.util';

type RunArgs = {
  readonly isOpen?: boolean;
  readonly isPinned?: boolean;
  readonly position?: SidePanelPosition;
  readonly shouldShowOverlay?: boolean;
  readonly size?: SidePanelSize;
  readonly width?: number;
};

type Surface = { readonly className?: string };

const run = ({
  isOpen = true,
  isPinned = false,
  position = 'right',
  shouldShowOverlay = true,
  size = 'md',
  width,
}: RunArgs = {}) =>
  resolveSidePanelSurfaceStyles({
    isOpen,
    isPinned,
    position,
    shouldShowOverlay,
    size,
    ...(width !== undefined && { width }),
  });

const declares = ({
  reference,
  surface,
}: {
  readonly reference: string;
  readonly surface: Surface;
}) => {
  const classes = new Set((surface.className ?? '').split(' '));

  return reference.split(' ').every((token) => classes.has(token));
};

const sizeReference = stylex.props(sidePanelStyles.size.md).className ?? '';

describe('resolveSidePanelSurfaceStyles', () => {
  it('paints the size variant while no reader has resized the panel', () => {
    const surface = run();

    expect({
      declaresSize: declares({ reference: sizeReference, surface }),
      inlineWidth: surface.style,
    }).toStrictEqual({ declaresSize: true, inlineWidth: undefined });
  });

  it('lets a resized width replace the size variant rather than sit beside it', () => {
    const surface = run({ width: 500 });

    expect({
      clamped: Object.values(surface.style ?? {}).includes(
        `max(${SIDE_PANEL_MIN_WIDTH}px, min(500px, ${SIDE_PANEL_MAX_WIDTH_RATIO * 100}vw))`,
      ),
      declaresSize: declares({ reference: sizeReference, surface }),
    }).toStrictEqual({ clamped: true, declaresSize: false });
  });

  it('takes the closed transform while the panel is shut', () => {
    const reference =
      stylex.props(sidePanelStyles.position.rightClosed).className ?? '';

    expect({
      open: declares({ reference, surface: run() }),
      shut: declares({ reference, surface: run({ isOpen: false }) }),
    }).toStrictEqual({ open: false, shut: true });
  });

  it('anchors the panel to the edge it opens from', () => {
    const reference =
      stylex.props(sidePanelStyles.position.left).className ?? '';

    expect({
      left: declares({ reference, surface: run({ position: 'left' }) }),
      right: declares({ reference, surface: run() }),
    }).toStrictEqual({ left: true, right: false });
  });

  it('drops the backdrop when the panel shows no overlay', () => {
    const reference =
      stylex.props(sidePanelStyles.withBackdrop).className ?? '';

    expect({
      overlaid: declares({ reference, surface: run() }),
      plain: declares({
        reference,
        surface: run({ shouldShowOverlay: false }),
      }),
    }).toStrictEqual({ overlaid: true, plain: false });
  });

  it('adds the pinned surface only to a pinned panel', () => {
    const reference = stylex.props(sidePanelStyles.pinned).className ?? '';

    expect({
      dialog: declares({ reference, surface: run() }),
      pinned: declares({ reference, surface: run({ isPinned: true }) }),
    }).toStrictEqual({ dialog: false, pinned: true });
  });
});
