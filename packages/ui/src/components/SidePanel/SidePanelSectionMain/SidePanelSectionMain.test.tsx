// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { SidePanelSectionMain } from './SidePanelSectionMain.component';

describe('SidePanelSectionMain', () => {
  it("renders children inside a div with data-testid='side-panel-section-main'", () => {
    render(
      <SidePanelSectionMain>
        <p>Main content</p>
      </SidePanelSectionMain>,
    );

    expect(screen.getByTestId('side-panel-section-main').textContent).toContain(
      'Main content',
    );
  });
});
