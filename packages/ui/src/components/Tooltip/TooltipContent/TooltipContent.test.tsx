// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { TooltipContentProps } from './TooltipContent.types';

import { TooltipContent } from './TooltipContent.component';

afterEach(cleanup);

const renderContent = (overrides?: Partial<TooltipContentProps>) => {
  const props = {
    anchorName: '--tooltip-test',
    children: 'Helpful tooltip',
    id: 'tooltip-test',
    isVisible: false,
    placement: 'top',
    ref: createRef<HTMLDivElement>(),
    ...overrides,
  } satisfies TooltipContentProps;
  const view = render(<TooltipContent {...props} />);
  const popover = screen.getByRole('tooltip', { hidden: true });
  return { popover, props, view };
};

describe('TooltipContent', () => {
  it('renders a manual popover with tooltip semantics and the given id', () => {
    const { popover } = renderContent();

    expect(popover.getAttribute('popover')).toBe('manual');
    expect(popover.getAttribute('id')).toBe('tooltip-test');
  });

  it('renders the tooltip content', () => {
    const { popover } = renderContent();

    expect(popover.textContent).toContain('Helpful tooltip');
  });

  it('forwards the ref to the popover element', () => {
    const ref = createRef<HTMLDivElement>();
    const { popover } = renderContent({ ref });

    expect(ref.current).toBe(popover);
  });

  it('renders an arrow element before the content', () => {
    const { popover } = renderContent();
    const arrow = popover.querySelector('span');

    expect(arrow).not.toBeNull();
    expect(popover.firstElementChild).toBe(arrow);
  });

  it('applies the measured arrow offset as an inline style', () => {
    const { popover } = renderContent({ arrowOffset: 17 });
    const arrow = popover.querySelector('span');

    expect(arrow?.getAttribute('style') ?? '').toContain('17px');
  });

  it('applies no inline arrow offset before measurement', () => {
    const { popover } = renderContent();
    const arrow = popover.querySelector('span');

    expect(arrow?.getAttribute('style') ?? '').not.toContain('px');
  });
});
