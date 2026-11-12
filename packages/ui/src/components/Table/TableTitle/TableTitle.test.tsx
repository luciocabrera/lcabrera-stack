// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { TableTitle } from './TableTitle.component';

const { useGetTableTitleDensityMock, useGetTableTitlePluralMock } = vi.hoisted(
  () => ({
    useGetTableTitleDensityMock: vi.fn(() => 'compact'),
    useGetTableTitlePluralMock: vi.fn(),
  }),
);

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableTitleDensity: useGetTableTitleDensityMock,
  useGetTableTitlePlural: useGetTableTitlePluralMock,
}));

const renderTitleBarClass = (density: string) => {
  cleanup();
  useGetTableTitleDensityMock.mockReturnValue(density);
  useGetTableTitlePluralMock.mockReturnValue('Enterprise Orders');

  const { unmount } = render(<TableTitle />);
  const heading = screen.getByRole('heading', { name: 'Enterprise Orders' });
  const classes = `${heading.parentElement?.parentElement?.className} ${heading.className}`;

  unmount();

  return classes;
};

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

  it('sizes the title bar by its density, the same for the same level', () => {
    const compact = renderTitleBarClass('compact');

    expect(renderTitleBarClass('compact')).toBe(compact);
    expect(renderTitleBarClass('dense')).not.toBe(compact);
    expect(renderTitleBarClass('spacious')).not.toBe(compact);
  });
});
