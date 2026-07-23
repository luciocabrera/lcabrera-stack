// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { TableTitle } from './TableTitle.component';

const { useGetTableTitlePluralMock } = vi.hoisted(() => ({
  useGetTableTitlePluralMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableTitlePlural: useGetTableTitlePluralMock,
}));

describe('TableTitle', () => {
  it('renders nothing when title, icon, and actions are all missing', () => {
    useGetTableTitlePluralMock.mockReturnValue('');

    const { container } = render(<TableTitle />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the title from selector', () => {
    useGetTableTitlePluralMock.mockReturnValue('Enterprise Orders');

    render(<TableTitle />);

    const heading = screen.getByRole('heading', { name: 'Enterprise Orders' });
    expect(heading.tagName).toBe('H2');
  });

  it('renders icon and actions slots when provided', () => {
    useGetTableTitlePluralMock.mockReturnValue('');

    render(
      <TableTitle
        actions={<button type='button'>Refresh</button>}
        icon={<span>Icon</span>}
      />,
    );

    expect(screen.getByText('Icon').textContent).toBe('Icon');
    expect(screen.getByRole('button', { name: 'Refresh' }).tagName).toBe(
      'BUTTON',
    );
  });
});
