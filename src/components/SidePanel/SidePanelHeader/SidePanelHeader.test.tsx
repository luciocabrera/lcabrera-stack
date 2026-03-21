// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SidePanelHeader } from './SidePanelHeader.component';

afterEach(cleanup);

describe('SidePanelHeader', () => {
  it('renders children inside the header', () => {
    render(
      <SidePanelHeader>
        <h2>Panel Title</h2>
      </SidePanelHeader>,
    );

    expect(screen.getByTestId('side-panel-header').textContent).toContain(
      'Panel Title',
    );
  });

  it('renders actions slot when provided', () => {
    render(
      <SidePanelHeader actions={<button>Close</button>}>
        <h2>Panel Title</h2>
      </SidePanelHeader>,
    );

    expect(screen.getByRole('button', { name: 'Close' }).tagName).toBe(
      'BUTTON',
    );
  });
});
