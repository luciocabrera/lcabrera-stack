// @vitest-environment jsdom

import { Suspense } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableDataResolver } from './TableDataResolver.component';

describe('TableDataResolver', () => {
  it('resolves promise data and renders children output', async () => {
    const dataPromise = Promise.resolve({ total: 42 });

    render(
      <Suspense fallback={<span>Loading...</span>}>
        <TableDataResolver dataPromise={dataPromise}>
          {(response) => <span>Total: {response.total}</span>}
        </TableDataResolver>
      </Suspense>,
    );

    const resolvedText = await screen.findByText('Total: 42');
    expect(resolvedText.textContent).toBe('Total: 42');
  });
});
