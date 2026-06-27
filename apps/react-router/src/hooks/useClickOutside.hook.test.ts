// @vitest-environment jsdom

import type { RefObject } from 'react';

import { fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useClickOutside } from './useClickOutside.hook';

describe('useClickOutside', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('does not call the callback for clicks inside the guarded element', () => {
    const guardedElement = document.createElement('div');
    const onClickOutside = vi.fn();
    const ref = {
      current: guardedElement,
    } as RefObject<HTMLElement | null>;

    document.body.append(guardedElement);

    renderHook(() => {
      useClickOutside({ onClickOutside, ref });
    });

    fireEvent.mouseDown(guardedElement);

    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it('calls the callback for clicks outside the guarded element', () => {
    const guardedElement = document.createElement('div');
    const outsideElement = document.createElement('button');
    const onClickOutside = vi.fn();
    const ref = {
      current: guardedElement,
    } as RefObject<HTMLElement | null>;

    document.body.append(guardedElement, outsideElement);

    renderHook(() => {
      useClickOutside({ onClickOutside, ref });
    });

    fireEvent.mouseDown(outsideElement);

    expect(onClickOutside).toHaveBeenCalledTimes(1);
  });

  it('removes the mousedown listener on unmount', () => {
    const guardedElement = document.createElement('div');
    const onClickOutside = vi.fn();
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const ref = {
      current: guardedElement,
    } as RefObject<HTMLElement | null>;

    document.body.append(guardedElement);

    const { unmount } = renderHook(() => {
      useClickOutside({ onClickOutside, ref });
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function),
    );
  });
});
