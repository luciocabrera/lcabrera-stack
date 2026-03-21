// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TableDataResolver } from './TableDataResolver.component';

const { useMock } = vi.hoisted(() => ({
  useMock: vi.fn(),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');

  return {
    ...actual,
    use: useMock,
  };
});

describe('TableDataResolver', () => {
  it('passes resolved response to children render function', () => {
    useMock.mockReturnValue({ total: 42 });

    render(
      <TableDataResolver dataPromise={Promise.resolve({ total: 42 })}>
        {(response) => <span>Total: {response.total}</span>}
      </TableDataResolver>,
    );

    expect(screen.getByText('Total: 42').textContent).toBe('Total: 42');
  });
});
