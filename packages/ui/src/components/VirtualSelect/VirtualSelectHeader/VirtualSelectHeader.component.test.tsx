// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { useGetIsBusyMock } = vi.hoisted(() => ({
  useGetIsBusyMock: vi.fn(() => false),
}));

vi.mock('../contexts/meta/selectors', () => ({
  useGetIsBusy: useGetIsBusyMock,
}));

vi.mock('../VirtualSelectTrigger', () => ({
  VirtualSelectTrigger: () => (
    <button data-testid='virtual-select-trigger' type='button'>
      Trigger
    </button>
  ),
}));

import { VirtualSelectHeader } from './VirtualSelectHeader.component';

beforeEach(() => {
  useGetIsBusyMock.mockReturnValue(false);
});

afterEach(() => {
  cleanup();
});

describe('VirtualSelectHeader', () => {
  it('renders the self-connected trigger without an overlay while idle', () => {
    render(<VirtualSelectHeader />);

    expect(screen.getByTestId('virtual-select-trigger')).toBeTruthy();
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('renders the shimmer overlay while busy', () => {
    useGetIsBusyMock.mockReturnValue(true);

    render(<VirtualSelectHeader />);

    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByTestId('virtual-select-trigger')).toBeTruthy();
  });
});
