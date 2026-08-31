// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TooltipContentProps } from './TooltipContent.types';

import { TooltipContent } from './TooltipContent.component';
import { ARROW_STYLES } from './TooltipContent.constants';
import { styles } from './TooltipContent.stylex';

afterEach(cleanup);

const classesOf = (className: string) =>
  new Set(className.split(' ').filter(Boolean));

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

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'borders exactly two arrow edges for the %s placement',
    (placement) => {
      const unbordered = classesOf(stylex.props(styles.arrow).className ?? '');
      const placed = classesOf(
        stylex.props(styles.arrow, ARROW_STYLES[placement]).className ?? '',
      );
      const replaced = [...unbordered].filter((cls) => !placed.has(cls));

      expect(replaced).toHaveLength(2);
    },
  );

  it('renders the arrow with its placement styles applied', () => {
    const { popover } = renderContent({ placement: 'bottom' });
    const arrow = popover.querySelector('span');
    const rendered = classesOf(arrow?.className ?? '');

    const expected = (
      stylex.props(styles.arrow, ARROW_STYLES.bottom).className ?? ''
    ).split(' ');

    expect(expected.every((cls) => rendered.has(cls))).toBe(true);
  });
});
