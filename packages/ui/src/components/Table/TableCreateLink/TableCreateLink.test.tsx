// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TableCreateLink } from './TableCreateLink.component';

afterEach(cleanup);

describe('TableCreateLink', () => {
  it('renders a link with an aria-label derived from the title', () => {
    const router = createMemoryRouter(
      [
        {
          element: <TableCreateLink title='Projects' to='/projects/new' />,
          path: '/',
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);

    const link = screen.getByRole('link', { name: 'Create Projects' });
    expect(link.getAttribute('href')).toBe('/projects/new');
  });

  it('marks the link disabled when isBusy is true so it matches the settings button', () => {
    const router = createMemoryRouter(
      [
        {
          element: (
            <TableCreateLink isBusy title='Projects' to='/projects/new' />
          ),
          path: '/',
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);

    const link = screen.getByRole('link', { name: 'Create Projects' });
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });
});
