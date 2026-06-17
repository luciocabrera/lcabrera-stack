// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TableSuspenseBoundary } from './TableSuspenseBoundary.component';

const MockTableSkeleton = vi.hoisted(() => () => {
  return <div>Loading table skeleton</div>;
});

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
      <TableSuspenseBoundary
        dataPromise={pendingPromise}
        onRetry={() => void 0}
      >
        {(response) => <span>Resolved: {response}</span>}
      </TableSuspenseBoundary>,
    );

    expect(screen.getByText('Loading table skeleton').textContent).toBe(
      'Loading table skeleton',
    );
  });
});
