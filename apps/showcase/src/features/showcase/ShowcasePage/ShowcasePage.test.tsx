// @vitest-environment jsdom

import { ThemeProvider } from '@lcabrera/ui/contexts/ThemeContext';
import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ShowcasePage } from './ShowcasePage.component';

const renderPage = (initialTheme: 'dark' | 'light') => {
  const Stub = createRoutesStub([
    {
      Component: () => (
        <ThemeProvider initialTheme={initialTheme}>
          <ShowcasePage />
        </ThemeProvider>
      ),
      path: '/',
    },
  ]);

  return render(<Stub initialEntries={['/']} />);
};

afterEach(() => {
  cleanup();
});

describe('ShowcasePage', () => {
  it('keeps one level-1 title above level-2 sections and level-3 subsections', async () => {
    renderPage('light');

    await screen.findByRole('heading', { level: 1 });

    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName.slice(1)));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Design System Showcase' }),
    ).toBe(screen.getAllByRole('heading')[0]);
    expect(levels.filter((level) => level === 1)).toEqual([1]);
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(expect.arrayContaining(['Buttons', 'Cards', 'Side Panels']));
    expect(
      screen.getByRole('heading', { level: 3, name: 'Variants' }).tagName,
    ).toBe('H3');
  });

  it('offers the theme the page is not in', async () => {
    renderPage('dark');

    expect(
      await screen.findByRole('button', { name: /Light Mode/u }),
    ).toBeTruthy();
  });
});
