// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SidePanelBody } from './SidePanelBody.component';

describe('SidePanelBody', () => {
  it("renders children inside a div with data-testid='side-panel-body'", () => {
    render(
      <SidePanelBody>
        <p>Panel body content</p>
      </SidePanelBody>,
    );

    expect(screen.getByTestId('side-panel-body').textContent).toContain(
      'Panel body content',
    );
  });
});
