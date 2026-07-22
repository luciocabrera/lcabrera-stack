// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SKELETON_ROW_COUNT,
  ITEM_HEIGHT,
} from '../VirtualList.constants';
import { SkeletonOptions } from './SkeletonOptions.component';

describe('SkeletonOptions', () => {
  it('renders DEFAULT_SKELETON_ROW_COUNT placeholders when no containerHeight provided', () => {
    const { container } = render(<SkeletonOptions />);
    expect(container.children).toHaveLength(DEFAULT_SKELETON_ROW_COUNT);
  });

  it('renders correct number of placeholders based on containerHeight', () => {
    const containerHeight = ITEM_HEIGHT * 4;
    const { container } = render(
      <SkeletonOptions containerHeight={containerHeight} />,
    );
    expect(container.children).toHaveLength(4);
  });

  it('falls back to DEFAULT_SKELETON_ROW_COUNT when containerHeight is 0', () => {
    const { container } = render(<SkeletonOptions containerHeight={0} />);
    expect(container.children).toHaveLength(DEFAULT_SKELETON_ROW_COUNT);
  });
});
