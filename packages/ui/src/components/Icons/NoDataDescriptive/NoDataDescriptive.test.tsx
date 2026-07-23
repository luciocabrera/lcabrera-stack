// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { NoDataDescriptive } from './NoDataDescriptive.component';

describe('NoDataDescriptive', () => {
  afterEach(cleanup);

  it('renders an accessible illustration', () => {
    render(<NoDataDescriptive />);

    expect(screen.getByRole('img')).not.toBeNull();
  });

  it('exposes the no-data title for assistive technology', () => {
    const { container } = render(<NoDataDescriptive />);

    expect(container.querySelector('title')?.textContent).toBe('No data found');
  });
});
