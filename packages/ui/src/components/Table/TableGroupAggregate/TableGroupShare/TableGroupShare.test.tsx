// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { denominatorRef, isSharedRef } = vi.hoisted(() => ({
  denominatorRef: { current: undefined as number | undefined },
  isSharedRef: { current: true },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableColumnShare: () => isSharedRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableLocale: () => 'en-US',
}));

vi.mock('../utils/useGetTableShareDenominator.hook', () => ({
  useGetTableShareDenominator: () => denominatorRef.current,
}));

import { TableGroupShare } from './TableGroupShare.component';

afterEach(() => {
  cleanup();
  denominatorRef.current = undefined;
  isSharedRef.current = true;
});

describe('TableGroupShare', () => {
  it('renders nothing for a column that asked for no share', () => {
    isSharedRef.current = false;
    denominatorRef.current = 200;

    render(<TableGroupShare columnKey='revenue' value={50} />);

    expect(screen.queryByTestId('table-group-share')).toBeNull();
    expect(screen.queryByTestId('table-group-share-absent')).toBeNull();
  });

  it('renders the measure as a percentage of the grand total', () => {
    denominatorRef.current = 200;

    render(<TableGroupShare columnKey='revenue' value={50} />);

    expect(screen.getByText('25.0%')).toBeTruthy();
  });

  it('names the denominator in the accessible text', () => {
    // The same measure appears at several levels at once, so position cannot
    // carry which total a percentage is of (ADR-086).
    denominatorRef.current = 200;

    render(<TableGroupShare columnKey='revenue' value={50} />);

    expect(screen.getByText('25.0% of the grand total')).toBeTruthy();
  });

  it('hides the bar from the accessibility tree', () => {
    // It depicts a value that is already text beside it; announcing it again
    // would read the same quantity twice.
    denominatorRef.current = 200;

    render(<TableGroupShare columnKey='revenue' value={50} />);

    expect(
      screen.getByTestId('table-group-share-bar').getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('gives the bar a width proportional to the share', () => {
    denominatorRef.current = 200;

    const { container } = render(
      <TableGroupShare columnKey='revenue' value={50} />,
    );
    const fill = container.querySelector(
      ':scope [data-testid="table-group-share-bar"] > span',
    );

    // The width is a StyleX dynamic style, so it arrives as a custom property
    // rather than as a `style` attribute value.
    expect(fill?.getAttribute('style')).toContain('25%');
  });

  it('clamps the bar to its track without clamping the number', () => {
    // A measure and a total with opposite signs produce a share past 100%; the
    // bar must not paint outside the cell, and the number must still be true.
    denominatorRef.current = 50;

    const { container } = render(
      <TableGroupShare columnKey='revenue' value={200} />,
    );
    const fill = container.querySelector(
      ':scope [data-testid="table-group-share-bar"] > span',
    );

    expect(fill?.getAttribute('style')).toContain('100%');
    expect(screen.getByText('400.0%')).toBeTruthy();
  });

  it('renders an explicit absence when there is no denominator', () => {
    // Never `0.0%` and never `NaN` — a share nobody could compute is not a
    // share of nothing.
    render(<TableGroupShare columnKey='revenue' value={50} />);

    expect(screen.getByTestId('table-group-share-absent')).toBeTruthy();
    expect(screen.getByText('No share available')).toBeTruthy();
    expect(screen.queryByText('0.0%')).toBeNull();
  });

  it('renders a genuine zero as a share, not as an absence', () => {
    denominatorRef.current = 200;

    render(<TableGroupShare columnKey='revenue' value={0} />);

    expect(screen.getByText('0.0%')).toBeTruthy();
    expect(screen.queryByTestId('table-group-share-absent')).toBeNull();
  });
});
