// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const {
  mockOnDoubleClick,
  mockOnKeyDown,
  mockOnMouseDown,
  mockUseColumnResize,
  mockUseGetColumnWidth,
  mockUseGetNormalizedColumn,
} = vi.hoisted(() => ({
  mockOnDoubleClick: vi.fn(),
  mockOnKeyDown: vi.fn(),
  mockOnMouseDown: vi.fn(),
  mockUseColumnResize: vi.fn(),
  mockUseGetColumnWidth: vi.fn(),
  mockUseGetNormalizedColumn: vi.fn(),
}));

vi.mock('#ui/components/Table/hooks', () => ({
  useColumnResize: mockUseColumnResize,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumnWidth: mockUseGetColumnWidth,
  useGetNormalizedColumn: mockUseGetNormalizedColumn,
}));

import { ResizeHandle } from './ResizeHandle.component';

const renderHandle = () =>
  render(<ResizeHandle columnKey='name' columnLabel='Name' />);

const getSplitter = () =>
  screen.getByRole('separator', { name: 'Resize Name column' });

beforeEach(() => {
  vi.clearAllMocks();
  mockUseGetNormalizedColumn.mockReturnValue({ maxWidth: 400, minWidth: 80 });
  mockUseGetColumnWidth.mockReturnValue(120);
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
  });

  it('is not a tab stop, because the grid owns the only one', () => {
    renderHandle();

    expect(getSplitter().tabIndex).toBe(-1);
  });

  it('still accepts focus when something moves it here programmatically', () => {
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
