// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getButtonElement } from './getButtonElement.util';

afterEach(cleanup);

describe('getButtonElement', () => {
  it('returns a native button element', () => {
    render(getButtonElement({ children: 'Click me' }));

    const button = screen.getByTestId('button');
    expect(button.tagName).toBe('BUTTON');
  });

  it('renders children text inside the button', () => {
    render(getButtonElement({ children: 'Click me' }));

    expect(screen.getByTestId('button').textContent).toContain('Click me');
  });

  it('defaults the button type to "button"', () => {
    render(getButtonElement({ children: 'Default' }));

    expect(screen.getByTestId<HTMLButtonElement>('button').type).toBe('button');
  });

  it('lets a native type prop override the default', () => {
    render(getButtonElement({ children: 'Submit', type: 'submit' }));

    expect(screen.getByTestId<HTMLButtonElement>('button').type).toBe('submit');
  });

  it('renders as disabled when isDisabled is true', () => {
    render(getButtonElement({ children: 'Disabled', isDisabled: true }));

    expect(screen.getByTestId<HTMLButtonElement>('button').disabled).toBe(true);
  });

  it('renders as disabled when isBusy is true', () => {
    render(getButtonElement({ children: 'Busy', isBusy: true }));

    expect(screen.getByTestId<HTMLButtonElement>('button').disabled).toBe(true);
  });

  it('renders the icon slot when icon prop is provided', () => {
    render(
      getButtonElement({
        children: 'With Icon',
        icon: <span data-testid='icon'>★</span>,
      }),
    );

    expect(screen.getByTestId('icon')).not.toBeNull();
  });

  it('calls the onClick handler when clicked', () => {
    const handleClick = vi.fn();

    render(getButtonElement({ children: 'Clickable', onClick: handleClick }));

    fireEvent.click(screen.getByTestId('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('forwards native button attributes via rest props', () => {
    render(getButtonElement({ 'aria-label': 'save', children: 'Save' }));

    expect(screen.getByTestId('button').getAttribute('aria-label')).toBe(
      'save',
    );
  });

  it('applies StyleX classes for a non-default variant', () => {
    render(getButtonElement({ children: 'Ghost', variant: 'ghost' }));

    expect(screen.getByTestId('button').className).toBeTruthy();
  });

  it('produces identical classes across renders with the same args', () => {
    const firstRender = render(getButtonElement({ children: 'Stable' }));
    const firstClassName = firstRender.getByTestId('button').className;

    cleanup();

    const secondRender = render(getButtonElement({ children: 'Stable' }));

    expect(firstClassName).toBeTruthy();
    expect(firstClassName).toBe(secondRender.getByTestId('button').className);
  });
});
