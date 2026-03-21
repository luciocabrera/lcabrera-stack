// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TableSuspenseBoundary } from './TableSuspenseBoundary.component';

function MockTableSkeleton() {
  return <div>Loading table skeleton</div>;
}

vi.mock('../TableSkeleton', () => ({
  TableSkeleton: MockTableSkeleton,
}));

afterEach(() => {
  cleanup();
});

describe('TableSuspenseBoundary', () => {
  it('renders suspense fallback while data promise is pending', () => {
    const pendingPromise = new Promise<number>((_resolve) => void 0);

    render(
      <TableSuspenseBoundary dataPromise={pendingPromise}>
        {(response) => <span>Resolved: {response}</span>}
      </TableSuspenseBoundary>,
    );

    expect(screen.getByText('Loading table skeleton').textContent).toBe(
      'Loading table skeleton',
    );
  });

  it('renders children when data promise resolves', async () => {
    const dataPromise = Promise.resolve(12);

    render(
      <TableSuspenseBoundary dataPromise={dataPromise}>
        {(response) => <span>Resolved: {response}</span>}
      </TableSuspenseBoundary>,
    );
    await act(async () => {
      await dataPromise;
    });

    const resolved = await screen.findByText('Resolved: 12');
    expect(resolved.textContent).toBe('Resolved: 12');
  });
});
