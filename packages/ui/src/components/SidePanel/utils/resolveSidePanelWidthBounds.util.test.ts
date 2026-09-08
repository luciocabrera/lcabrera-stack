import { describe, expect, it } from 'vite-plus/test';

import { SIDE_PANEL_MIN_WIDTH } from '../SidePanel.constants';
import { resolveSidePanelWidthBounds } from './resolveSidePanelWidthBounds.util';

describe('resolveSidePanelWidthBounds', () => {
  it('caps the panel below the viewport it sits in', () => {
    expect(resolveSidePanelWidthBounds({ viewportWidth: 1000 })).toStrictEqual({
      maxWidth: 900,
      minWidth: SIDE_PANEL_MIN_WIDTH,
    });
  });

  it('never hands back a ceiling under the floor', () => {
    expect(resolveSidePanelWidthBounds({ viewportWidth: 200 }).maxWidth).toBe(
      SIDE_PANEL_MIN_WIDTH,
    );
  });
});
