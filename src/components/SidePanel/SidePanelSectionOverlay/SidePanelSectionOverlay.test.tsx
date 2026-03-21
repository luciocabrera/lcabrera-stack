// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SidePanelSectionOverlay } from './SidePanelSectionOverlay.component';

afterEach(cleanup);

describe('SidePanelSectionOverlay', () => {
  it('renders children always', () => {
    render(
      <SidePanelSectionOverlay isOpen={false}>
        <p>Always visible</p>
      </SidePanelSectionOverlay>,
    );

    expect(screen.getByText('Always visible').textContent).toBe(
      'Always visible',
    );
  });

  it('shows overlay when isOpen is true', () => {
    const { container } = render(
      <SidePanelSectionOverlay isOpen>
        <p>Content</p>
      </SidePanelSectionOverlay>,
    );

    expect(screen.getByText('Content').textContent).toBe('Content');
    expect(container.querySelectorAll('div').length).toBeGreaterThan(1);
  });
});
