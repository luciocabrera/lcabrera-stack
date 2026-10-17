// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsPageHeader } from './EvalsPageHeader.component';

afterEach(() => {
  cleanup();
});

describe('EvalsPageHeader', () => {
  it('titles the page and links back to the overview', () => {
    render(
      <MemoryRouter>
        <EvalsPageHeader title='Heatmap' trail='heatmap' />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Heatmap',
    );
    expect(
      screen.getByRole('link', { name: 'Evals' }).getAttribute('href'),
    ).toBe('/evals');
  });
});
