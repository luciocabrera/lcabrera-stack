// @vitest-environment jsdom

import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { renderGroupedTableRoute } from './renderGroupedTableRoute.util';

afterEach(cleanup);

describe('renderGroupedTableRoute', () => {
  it('mounts the element at the root path', () => {
    renderGroupedTableRoute(<p>grid</p>);

    expect(screen.getByText('grid')).toBeTruthy();
  });
});
