// @vitest-environment jsdom

import * as stylex from '@stylexjs/stylex';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { formInputStyles } from '#ui/components/Form/fields/formInput.stylex';
import { Text } from '#ui/components/Text';

import { expectFieldLabel } from './expectFieldLabel.util';

afterEach(cleanup);

describe('expectFieldLabel', () => {
  it('passes for a field label and returns the control it names', () => {
    render(
      <div {...stylex.props(formInputStyles.field)}>
        <Text as='label' htmlFor='q' size='sm' weight='medium'>
          Search
        </Text>
        <input id='q' />
      </div>,
    );

    expect(expectFieldLabel('Search').id).toBe('q');
  });

  it('fails for a label drawn at another size', () => {
    render(
      <div {...stylex.props(formInputStyles.field)}>
        <Text as='label' htmlFor='q' size='md' weight='medium'>
          Search
        </Text>
        <input id='q' />
      </div>,
    );

    expect(() => expectFieldLabel('Search')).toThrow('to strictly equal');
  });

  it('fails for a label outside the field wrapper', () => {
    render(
      <div>
        <Text as='label' htmlFor='q' size='sm' weight='medium'>
          Search
        </Text>
        <input id='q' />
      </div>,
    );

    expect(() => expectFieldLabel('Search')).toThrow('to strictly equal');
  });
});
