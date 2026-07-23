// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ClearResetToolbarButtonsProps } from './ClearResetToolbarButtons.types';

import { ClearResetToolbarButtons } from './ClearResetToolbarButtons.component';

const CLEAR_LABEL = 'Clear Sorting';
const RESET_LABEL = 'Reset Sorting';

type RenderArgs = Partial<
  Omit<ClearResetToolbarButtonsProps, 'clearLabel' | 'resetLabel'>
> &
  Pick<ClearResetToolbarButtonsProps, 'variant'>;

const renderButtons = ({
  hasValue = true,
  isBusy,
  onClear = vi.fn(),
  onReset = vi.fn(),
  variant,
}: RenderArgs) => {
  render(
    <ClearResetToolbarButtons
      clearLabel={CLEAR_LABEL}
      hasValue={hasValue}
      isBusy={isBusy}
      onClear={onClear}
      onReset={onReset}
      resetLabel={RESET_LABEL}
      variant={variant}
    />,
  );

  return { onClear, onReset };
};

const getClearButton = () => screen.getByRole('button', { name: CLEAR_LABEL });
const getResetButton = () => screen.getByRole('button', { name: RESET_LABEL });

const getIsDisabled = (button: HTMLElement) => button.hasAttribute('disabled');

const getIconWidth = (button: HTMLElement) =>
  button.querySelector('svg')?.getAttribute('width');

afterEach(() => {
  cleanup();
});

describe('ClearResetToolbarButtons', () => {
  describe('clear button', () => {
    it('is enabled and calls onClear when there is a value', () => {
      const { onClear, onReset } = renderButtons({
        hasValue: true,
        variant: 'footer',
      });

      const clearButton = getClearButton();
      expect(getIsDisabled(clearButton)).toBe(false);

      fireEvent.click(clearButton);

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onReset).not.toHaveBeenCalled();
    });

    it('is disabled and does not call onClear when there is no value', () => {
      const { onClear } = renderButtons({
        hasValue: false,
        variant: 'footer',
      });

      const clearButton = getClearButton();
      expect(getIsDisabled(clearButton)).toBe(true);

      fireEvent.click(clearButton);

      expect(onClear).not.toHaveBeenCalled();
    });
  });

  describe('reset button', () => {
    it('calls onReset and leaves onClear untouched', () => {
      const { onClear, onReset } = renderButtons({ variant: 'footer' });

      fireEvent.click(getResetButton());

      expect(onReset).toHaveBeenCalledTimes(1);
      expect(onClear).not.toHaveBeenCalled();
    });

    it('stays enabled even when there is no value to clear', () => {
      const { onReset } = renderButtons({
        hasValue: false,
        variant: 'footer',
      });

      const resetButton = getResetButton();
      expect(getIsDisabled(resetButton)).toBe(false);

      fireEvent.click(resetButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('isBusy', () => {
    it('disables both buttons and ignores clicks while busy', () => {
      const { onClear, onReset } = renderButtons({
        hasValue: true,
        isBusy: true,
        variant: 'footer',
      });

      const clearButton = getClearButton();
      const resetButton = getResetButton();

      expect(getIsDisabled(clearButton)).toBe(true);
      expect(getIsDisabled(resetButton)).toBe(true);

      fireEvent.click(clearButton);
      fireEvent.click(resetButton);

      expect(onClear).not.toHaveBeenCalled();
      expect(onReset).not.toHaveBeenCalled();
    });

    it('defaults to not busy when the prop is omitted', () => {
      renderButtons({ hasValue: true, variant: 'footer' });

      expect(getIsDisabled(getClearButton())).toBe(false);
      expect(getIsDisabled(getResetButton())).toBe(false);
    });
  });

  describe('footer variant', () => {
    it('renders the labels as visible button text', () => {
      renderButtons({ variant: 'footer' });

      expect(getClearButton().textContent).toContain(CLEAR_LABEL);
      expect(getResetButton().textContent).toContain(RESET_LABEL);
    });

    it('renders no tooltip', () => {
      renderButtons({ variant: 'footer' });

      expect(screen.queryAllByRole('tooltip', { hidden: true })).toHaveLength(
        0,
      );
    });

    it('renders medium icons', () => {
      renderButtons({ variant: 'footer' });

      expect(getIconWidth(getClearButton())).toBe('16');
      expect(getIconWidth(getResetButton())).toBe('16');
    });
  });

  describe('toolbar variant', () => {
    it('renders icon-only buttons that keep their accessible names', () => {
      renderButtons({ variant: 'toolbar' });

      expect(getClearButton().textContent).toBe('');
      expect(getResetButton().textContent).toBe('');
    });

    it('exposes each label through a tooltip', () => {
      renderButtons({ variant: 'toolbar' });

      const tooltipTexts = screen
        .queryAllByRole('tooltip', { hidden: true })
        .map((tooltip) => tooltip.textContent);

      expect(tooltipTexts).toEqual([CLEAR_LABEL, RESET_LABEL]);
    });

    it('renders small icons', () => {
      renderButtons({ variant: 'toolbar' });

      expect(getIconWidth(getClearButton())).toBe('14');
      expect(getIconWidth(getResetButton())).toBe('14');
    });

    it('still respects the disabled state of the clear button', () => {
      const { onClear } = renderButtons({
        hasValue: false,
        variant: 'toolbar',
      });

      const clearButton = getClearButton();
      expect(getIsDisabled(clearButton)).toBe(true);

      fireEvent.click(clearButton);

      expect(onClear).not.toHaveBeenCalled();
    });
  });
});
