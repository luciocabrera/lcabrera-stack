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
    useMock.mockReturnValue({ data: { total: 42 }, ok: true });

    render(
      <TableDataResolver
        onRetry={() => void 0}
        safeDataPromise={Promise.resolve({ data: { total: 42 }, ok: true })}
      >
        {(response: { total: number }) => <span>Total: {response.total}</span>}
      </TableDataResolver>,
    );

    expect(screen.getByText('Total: 42').textContent).toBe('Total: 42');
  });
});
