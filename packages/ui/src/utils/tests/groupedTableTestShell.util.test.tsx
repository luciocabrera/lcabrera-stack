// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { GroupedTableTestShell } from './groupedTableTestShell.util';

afterEach(cleanup);

describe('GroupedTableTestShell', () => {
  it('mounts a scroll container around the grouped grid', () => {
    render(
      <GroupedTableTestShell
        columns={[{ isPrimaryKey: true, key: 'id', label: 'Id' }]}
        data={[{ id: 1 }]}
        groupingState={{ keys: ['id'] }}
      />,
    );

    expect(screen.getByTestId('scroll-container')).toBeTruthy();
    expect(screen.getByRole('grid')).toBeTruthy();
  });
});
