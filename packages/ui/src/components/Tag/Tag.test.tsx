// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@lcabrera/ui/components/Button', () => ({
  Button: MockButton,
}));

import { Tag } from './Tag.component';

afterEach(cleanup);

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
});
