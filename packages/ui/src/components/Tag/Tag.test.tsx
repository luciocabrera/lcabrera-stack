// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { MockButton } = vi.hoisted(() => ({
  MockButton: vi.fn(
    ({
      'aria-label': ariaLabel,
      onClick,
    }: {
      readonly 'aria-label'?: string;
      readonly onClick?: React.MouseEventHandler<HTMLButtonElement>;
    }) => <button aria-label={ariaLabel} onClick={onClick} type='button' />,
  ),
}));

vi.mock('#ui/components/Button', () => ({
  Button: MockButton,
}));

import { Tag } from './Tag.component';

afterEach(() => {
  cleanup();
  MockButton.mockClear();
});

describe('Tag', () => {
  it('renders the label text', () => {
    render(<Tag label='React' onRemove={vi.fn()} />);

    expect(screen.getByText('React').textContent).toBe('React');
  });

  it('calls onRemove when the remove button is clicked', () => {
    const handleRemove = vi.fn();

    render(<Tag label='React' onRemove={handleRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove React' }));

    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('keeps the click from reaching anything around the chip', () => {
    const handleBodyClick = vi.fn();

    document.body.addEventListener('click', handleBodyClick);
    render(<Tag label='React' onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove React' }));
    document.body.removeEventListener('click', handleBodyClick);

    expect(handleBodyClick).not.toHaveBeenCalled();
  });

  it('renders a read-only chip with no remove button without onRemove', () => {
    render(<Tag label='React' />);

    expect(screen.getByText('React').textContent).toBe('React');
    expect(screen.queryByRole('button')).toBeNull();
    expect(MockButton).not.toHaveBeenCalled();
  });
});
