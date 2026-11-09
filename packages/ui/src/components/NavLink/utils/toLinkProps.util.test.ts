import { describe, expect, it } from 'vite-plus/test';

import { toLinkProps } from './toLinkProps.util';

describe('toLinkProps', () => {
  it('marks an active link as the current page', () => {
    expect(
      toLinkProps({ isActive: true, props: { to: '?view=a' } }),
    ).toStrictEqual({ 'aria-current': 'page', to: '?view=a' });
  });

  it('leaves aria-current off an inactive link', () => {
    expect(
      toLinkProps({ isActive: false, props: { to: '?view=a' } })[
        'aria-current'
      ],
    ).toBeUndefined();
  });

  it('keeps an explicit aria-current token for the active link', () => {
    expect(
      toLinkProps({
        isActive: true,
        props: { 'aria-current': 'step', to: '?step=2' },
      })['aria-current'],
    ).toBe('step');
  });

  it('resolves className and style render functions against the given state', () => {
    const props = toLinkProps({
      isActive: true,
      props: {
        className: ({ isActive, isPending, isTransitioning }) =>
          `${String(isActive)}-${String(isPending)}-${String(isTransitioning)}`,
        style: ({ isActive }) => ({ opacity: isActive ? 1 : 0.5 }),
        to: '/docs',
      },
    });

    expect(props.className).toBe('true-false-false');
    expect(props.style).toEqual({ opacity: 1 });
  });

  it('passes a plain className and style through unchanged', () => {
    const props = toLinkProps({
      isActive: false,
      props: { className: 'link', style: { opacity: 0.5 }, to: '/docs' },
    });

    expect(props.className).toBe('link');
    expect(props.style).toEqual({ opacity: 0.5 });
  });
});
