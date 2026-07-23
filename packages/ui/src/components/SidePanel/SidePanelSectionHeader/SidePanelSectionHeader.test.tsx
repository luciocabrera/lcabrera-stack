// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SidePanelSectionHeader } from './SidePanelSectionHeader.component';

afterEach(cleanup);

describe('SidePanelSectionHeader', () => {
  it('renders title text inside h3', () => {
    render(<SidePanelSectionHeader title='Section Title' />);

    const header = screen.getByTestId('side-panel-section-header');
    const h3 = header.querySelector('h3');
    expect(h3?.textContent).toContain('Section Title');
  });

  it('renders toolbar slot when provided', () => {
    render(
      <SidePanelSectionHeader
        title='Section Title'
        toolbar={<button type='button'>Edit</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit' }).tagName).toBe('BUTTON');
  });
});
