// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('../contexts/meta/selectors', () => ({
  useGetLabelId: () => 'state-label',
}));

import { Text } from '#ui/components/Text';

import { styles } from '../VirtualSelect.stylex';
import { VirtualSelectLabel } from './VirtualSelectLabel.component';

afterEach(cleanup);

describe('VirtualSelectLabel', () => {
  it('draws the label as small medium text under the id the triggers point at', () => {
    render(<VirtualSelectLabel label='State' />);

    const label = screen.getByText('State');
    const { container: reference } = render(
      <Text as='span' customStylex={styles.label} size='sm' weight='medium'>
        Reference
      </Text>,
    );

    expect(label.tagName).toBe('SPAN');
    expect(label.id).toBe('state-label');
    expect(label.className).toBe(reference.firstElementChild?.className);
  });

  it('renders nothing without a label', () => {
    const { container } = render(<VirtualSelectLabel label={undefined} />);

    expect(container.childElementCount).toBe(0);
  });
});
