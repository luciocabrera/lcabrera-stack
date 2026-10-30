// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { TableDensityContext } from '#ui/components/Table/contexts/TableConfig/TableDensityContext.context';
import { TableRow } from '#ui/components/Table/TableRow';

import type {
  TableDensityDefaults,
  TableMetaState,
} from '../../../Table.types';

import { TableDrawerProvider } from '../../TableDrawerContext/TableDrawerContext.provider';
import { DensitySection } from './DensitySection.component';

type RenderSectionArgs = {
  readonly defaults?: TableDensityDefaults;
  readonly isBusy?: boolean;
  readonly metaState?: Partial<TableMetaState>;
};

const renderSection = ({
  defaults = {},
  isBusy,
  metaState = {},
}: RenderSectionArgs = {}) =>
  render(
    <TableConfigProvider columnsState={{ columns: [] }} metaState={metaState}>
      <TableDensityContext value={defaults}>
        <TableDrawerProvider>
          <DensitySection isBusy={isBusy} />
        </TableDrawerProvider>
        <table>
          <tbody>
            <TableRow title='body-row'>
              <td>Row</td>
            </TableRow>
          </tbody>
        </table>
      </TableDensityContext>
    </TableConfigProvider>,
  );

const checkedLevel = () =>
  screen.getAllByRole<HTMLInputElement>('radio').find((radio) => radio.checked)
    ?.value;

afterEach(cleanup);

describe('DensitySection', () => {
  it('lists all four levels, tightest first, each with its row height', () => {
    renderSection();

    expect(screen.getByRole('group', { name: 'Density' })).not.toBeNull();
    expect(
      screen
        .getAllByRole<HTMLInputElement>('radio')
        .map((radio) => radio.value),
    ).toStrictEqual(['dense', 'compact', 'comfortable', 'spacious']);
    expect(screen.getByRole('radio', { name: 'Dense' })).not.toBeNull();
    expect(screen.getByRole('radio', { name: 'Compact' })).not.toBeNull();
    expect(screen.getByRole('radio', { name: 'Comfortable' })).not.toBeNull();
    expect(screen.getByRole('radio', { name: 'Spacious' })).not.toBeNull();
    expect(screen.getByText('24px rows')).not.toBeNull();
    expect(screen.getByText('48px rows')).not.toBeNull();
  });

  it('checks compact when nothing names a level', () => {
    renderSection();

    expect(checkedLevel()).toBe('compact');
  });

  it('checks the level the meta state holds over the table default', () => {
    renderSection({
      defaults: { density: 'dense' },
      metaState: { density: 'comfortable' },
    });

    expect(checkedLevel()).toBe('comfortable');
  });

  it('checks the table default when the meta state holds none', () => {
    renderSection({ defaults: { density: 'spacious' } });

    expect(checkedLevel()).toBe('spacious');
  });

  it('stages a chosen level without touching the rows', () => {
    renderSection();

    fireEvent.click(screen.getByRole('radio', { name: 'Dense' }));

    expect(checkedLevel()).toBe('dense');
    expect(
      screen.getByTitle('body-row').style.getPropertyValue('--x-height'),
    ).toBe('32px');
  });

  it('disables every level while the table is busy', () => {
    renderSection({ isBusy: true });

    expect(
      screen
        .getAllByRole<HTMLInputElement>('radio')
        .every((radio) => radio.matches(':disabled')),
    ).toBe(true);
  });
});
