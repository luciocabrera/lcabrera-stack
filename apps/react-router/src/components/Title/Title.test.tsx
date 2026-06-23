// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Title } from './Title.component';

const { useGetTitleMock } = vi.hoisted(() => ({
  useGetTitleMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTitle: useGetTitleMock,
}));

describe('Title', () => {
  it('renders nothing when title, icon, and actions are all missing', () => {
    useGetTitleMock.mockReturnValue('');

    const { container } = render(<Title />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the title from selector', () => {
    useGetTitleMock.mockReturnValue('Enterprise Orders');

    render(<Title />);

    const heading = screen.getByRole('heading', { name: 'Enterprise Orders' });
    expect(heading.tagName).toBe('H2');
  });

  it('renders icon and actions slots when provided', () => {
    useGetTitleMock.mockReturnValue('');

    render(
      <Title
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
