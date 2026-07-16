// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockOnDoubleClick,
  mockOnKeyDown,
  mockOnMouseDown,
  mockUseColumnResize,
} = vi.hoisted(() => ({
  mockOnDoubleClick: vi.fn(),
  mockOnKeyDown: vi.fn(),
  mockOnMouseDown: vi.fn(),
  mockUseColumnResize: vi.fn(),
}));

vi.mock('@repo/ui/components/Table/hooks', () => ({
  useColumnResize: mockUseColumnResize,
}));

import { ResizeHandle } from './ResizeHandle.component';

const renderHandle = () =>
  render(
    <ResizeHandle
      columnKey='name'
      columnLabel='Name'
      currentWidth={120}
      maxWidth={400}
      minWidth={80}
    />,
  );

const getSplitter = () =>
  screen.getByRole('separator', { name: 'Resize Name column' });

beforeEach(() => {
  vi.clearAllMocks();
  mockUseColumnResize.mockReturnValue({
    bounds: { maxWidth: 400, minWidth: 80 },
    isResizing: false,
    onDoubleClick: mockOnDoubleClick,
    onKeyDown: mockOnKeyDown,
    onMouseDown: mockOnMouseDown,
    width: 120,
  });
});

afterEach(cleanup);

describe('ResizeHandle', () => {
  it('passes the column to useColumnResize and announces what it returns', () => {
    renderHandle();

    expect(mockUseColumnResize).toHaveBeenCalledWith({
      columnKey: 'name',
      currentWidth: 120,
      maxWidth: 400,
      minWidth: 80,
    });

    const splitter = getSplitter();
    expect(splitter.getAttribute('aria-orientation')).toBe('vertical');
    expect(splitter.getAttribute('aria-valuenow')).toBe('120');
    expect(splitter.getAttribute('aria-valuemin')).toBe('80');
    expect(splitter.getAttribute('aria-valuemax')).toBe('400');
    expect(splitter.getAttribute('aria-valuetext')).toBe('120 pixels');
    expect(splitter.tabIndex).toBe(0);
  });

  it('is reachable by keyboard as a focusable splitter', () => {
    renderHandle();

    const splitter = getSplitter();
    splitter.focus();

    expect(document.activeElement).toBe(splitter);
  });

  it('spreads every handler from the hook onto the host element', () => {
    renderHandle();

    fireEvent.mouseDown(getSplitter());
    expect(mockOnMouseDown).toHaveBeenCalledTimes(1);

    fireEvent.doubleClick(getSplitter());
    expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(getSplitter(), { key: 'ArrowRight' });
    expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
  });
});
