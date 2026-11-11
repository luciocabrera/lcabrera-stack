// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableMetaState } from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';

import type { DensitySectionProps } from './DensitySection.types';

import { DensitySection } from './DensitySection.component';

type RenderSectionArgs = Partial<DensitySectionProps> & {
  readonly metaState?: Partial<TableMetaState>;
};

const renderSection = ({
  metaState = {},
  ...props
}: RenderSectionArgs = {}) => {
  const onChange = vi.fn();

  render(
    <TableConfigProvider columnsState={{ columns: [] }} metaState={metaState}>
      <DensitySection
        defaultLabel='Default (Compact)'
        name='table-density'
        onChange={onChange}
        title='Row Density'
        value={undefined}
        {...props}
      />
    </TableConfigProvider>,
  );

  return { onChange };
};

const checkedValue = () =>
  screen.getAllByRole<HTMLInputElement>('radio').find((radio) => radio.checked)
    ?.value;

afterEach(cleanup);

describe('DensitySection', () => {
  it('leads with the default, then lists the four levels tightest first, each with its row height', () => {
    renderSection();

    expect(screen.getByRole('group', { name: 'Row Density' })).not.toBeNull();
    expect(
      screen
        .getAllByRole<HTMLInputElement>('radio')
        .map((radio) => radio.value),
    ).toStrictEqual(['default', 'dense', 'compact', 'comfortable', 'spacious']);
    expect(
      screen.getByRole('radio', { name: 'Default (Compact)' }),
    ).not.toBeNull();
    expect(screen.getByText('24px rows')).not.toBeNull();
    expect(screen.getByText('48px rows')).not.toBeNull();
  });

  it('checks the default when the table holds no level of its own', () => {
    renderSection();

    expect(checkedValue()).toBe('default');
  });

  it('checks the level the table holds', () => {
    renderSection({ value: 'comfortable' });

    expect(checkedValue()).toBe('comfortable');
  });

  it('reports a level by name and the default as undefined', () => {
    const { onChange } = renderSection({ value: 'dense' });

    fireEvent.click(screen.getByRole('radio', { name: 'Spacious' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Default (Compact)' }));

    expect(onChange.mock.calls).toStrictEqual([['spacious'], [undefined]]);
  });

  it('leaves every option enabled when the table is not busy', () => {
    renderSection();

    expect(
      screen
        .getAllByRole<HTMLInputElement>('radio')
        .every((radio) => radio.matches(':enabled')),
    ).toBe(true);
  });

  it('disables every option while the table is busy', () => {
    renderSection({ isBusy: true });

    expect(
      screen
        .getAllByRole<HTMLInputElement>('radio')
        .every((radio) => radio.matches(':disabled')),
    ).toBe(true);
  });

  it('names each level with no row height when the meta state sets its own rowHeight', () => {
    renderSection({ metaState: { rowHeight: 36 } });

    expect(screen.getByRole('radio', { name: 'Spacious' })).not.toBeNull();
    expect(screen.queryByText(/px rows/)).toBeNull();
  });
});
