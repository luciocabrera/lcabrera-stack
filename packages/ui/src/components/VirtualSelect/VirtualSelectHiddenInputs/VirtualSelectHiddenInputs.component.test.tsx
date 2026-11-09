// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { VirtualSelectHiddenInputs } from './VirtualSelectHiddenInputs.component';

afterEach(cleanup);

const readInputs = (container: HTMLElement) =>
  [...container.querySelectorAll('input')].map((input) => [
    input.type,
    input.name,
    input.value,
  ]);

describe('VirtualSelectHiddenInputs', () => {
  it('renders one hidden input per selected value, in order, under the name', () => {
    const { container } = render(
      <VirtualSelectHiddenInputs name='state' selected={['open', 'closed']} />,
    );

    expect(readInputs(container)).toStrictEqual([
      ['hidden', 'state', 'open'],
      ['hidden', 'state', 'closed'],
    ]);
  });

  it('renders nothing without a name, whatever is selected', () => {
    const { container } = render(
      <VirtualSelectHiddenInputs name={undefined} selected={['open']} />,
    );

    expect(container.childElementCount).toBe(0);
  });
});
