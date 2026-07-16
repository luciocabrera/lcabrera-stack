// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const formatCurrencyMock = vi.hoisted(() => vi.fn());
const formatDateMock = vi.hoisted(() => vi.fn());
const formatNumberMock = vi.hoisted(() => vi.fn());

vi.mock('@repo/ui/utils/formatters', () => ({
  formatCurrency: formatCurrencyMock,
  formatDate: formatDateMock,
  formatNumber: formatNumberMock,
}));

import { renderCellContent } from './renderCellContent.util';

describe('renderCellContent', () => {
  beforeEach(() => {
    formatCurrencyMock.mockReset();
    formatDateMock.mockReset();
    formatNumberMock.mockReset();
  });

  it('renders a boolean value using TableCheckDisplay', () => {
    render(
      <>
        {renderCellContent({
          dataType: 'boolean',
          label: 'Enabled',
          value: true,
        })}
      </>,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'Enabled: Yes',
    });

    expect(checkbox).toBeTruthy();
  });

  it('formats currency when value is numeric-like', () => {
    formatCurrencyMock.mockReturnValue('USD 42.00');

    const content = renderCellContent({
      dataType: 'currency',
      format: {
        currency: {
          currency: 'USD',
          locale: 'en-US',
        },
      },
      value: '42',
    });

    expect(content).toBe('USD 42.00');
    expect(formatCurrencyMock).toHaveBeenCalledWith({
      currency: 'USD',
      locale: 'en-US',
      value: 42,
    });
  });

  it('falls back to stringified value when currency cannot be parsed', () => {
    const content = renderCellContent({
      dataType: 'currency',
      value: { amount: 'NaN' },
    });

    expect(content).toBe('{"amount":"NaN"}');
    expect(formatCurrencyMock).not.toHaveBeenCalled();
  });

  it('renders blank currency and number cells as empty instead of zero', () => {
    const rendered = [
      renderCellContent({ dataType: 'currency', value: '' }),
      renderCellContent({ dataType: 'number', value: '' }),
    ];

    expect(rendered).toEqual(['', '']);
    expect(formatCurrencyMock).not.toHaveBeenCalled();
    expect(formatNumberMock).not.toHaveBeenCalled();
  });

  it('does not coerce a whitespace-only value to zero, matching text cells', () => {
    const whitespace = ' '.repeat(3);

    const rendered = [
      renderCellContent({ dataType: 'currency', value: whitespace }),
      renderCellContent({ dataType: 'number', value: whitespace }),
    ];

    expect(rendered).toEqual([whitespace, whitespace]);
    expect(formatCurrencyMock).not.toHaveBeenCalled();
    expect(formatNumberMock).not.toHaveBeenCalled();
  });

  it('still formats a real zero', () => {
    formatNumberMock.mockReturnValue('0');

    const content = renderCellContent({
      dataType: 'number',
      value: 0,
    });

    expect(content).toBe('0');
    expect(formatNumberMock).toHaveBeenCalledWith({
      locale: undefined,
      maximumFractionDigits: undefined,
      minimumFractionDigits: undefined,
      value: 0,
    });
  });

  it('formats dates using provided locale and preset', () => {
    formatDateMock.mockReturnValue('01/02/2026');

    const content = renderCellContent({
      dataType: 'date',
      format: {
        date: {
          locale: 'en-GB',
          preset: 'short',
        },
      },
      value: '2026-02-01',
    });

    expect(content).toBe('01/02/2026');
    expect(formatDateMock).toHaveBeenCalledWith({
      locale: 'en-GB',
      preset: 'short',
      value: '2026-02-01',
    });
  });

  it('formats numbers when parse succeeds and stringifies when it fails', () => {
    formatNumberMock.mockReturnValue('1,234.5');

    const formatted = renderCellContent({
      dataType: 'number',
      format: {
        number: {
          maximumFractionDigits: 2,
          minimumFractionDigits: 1,
        },
      },
      value: '1234.5',
    });
    const fallback = renderCellContent({
      dataType: 'number',
      value: Symbol('invalid-number'),
    });

    expect(formatted).toBe('1,234.5');
    expect(fallback).toBe('');
    expect(formatNumberMock).toHaveBeenCalledWith({
      locale: undefined,
      maximumFractionDigits: 2,
      minimumFractionDigits: 1,
      value: 1234.5,
    });
  });

  it('returns only raw strings for fallback data type handling', () => {
    expect(
      renderCellContent({
        dataType: 'string',
        value: 'Status',
      }),
    ).toBe('Status');
    expect(
      renderCellContent({
        dataType: 'string',
        value: 42,
      }),
    ).toBe('');
  });
});
