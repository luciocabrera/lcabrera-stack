// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

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
});
