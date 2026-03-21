// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TableSuspenseBoundary } from './TableSuspenseBoundary.component';

const MockTableSkeleton = () => <div>Loading table skeleton</div>;

vi.mock('../TableSkeleton', () => ({
  TableSkeleton: MockTableSkeleton,
}));

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
    render(
      <TableSuspenseBoundary dataPromise={Promise.resolve(12)}>
        {(response) => <span>Resolved: {response}</span>}
      </TableSuspenseBoundary>,
    );

    const resolved = await screen.findByText('Resolved: 12');
    expect(resolved.textContent).toBe('Resolved: 12');
  });
});
