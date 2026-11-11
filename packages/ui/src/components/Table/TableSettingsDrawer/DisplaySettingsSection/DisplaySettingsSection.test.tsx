// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableDensityDefaults,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { TableDensityContext } from '#ui/components/Table/contexts/TableConfig/TableDensityContext.context';
import { TableRow } from '#ui/components/Table/TableRow';

import { TableDrawerProvider } from '../TableDrawerContext/TableDrawerContext.provider';
import { DisplaySettingsSection } from './DisplaySettingsSection.component';

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
          <DisplaySettingsSection isBusy={isBusy} />
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

const checkedIn = (group: string) =>
  screen
    .getByRole('group', { name: group })
    .querySelector<HTMLInputElement>('input:checked')?.value;

const radios = () => screen.getAllByRole<HTMLInputElement>('radio');

afterEach(cleanup);

describe('DisplaySettingsSection', () => {
  it('holds the width presets, the row density and the header density', () => {
    renderSection();

    expect(
      screen.getByRole('heading', { name: 'Column Widths' }),
    ).not.toBeNull();
    expect(screen.getByRole('group', { name: 'Row Density' })).not.toBeNull();
    expect(
      screen.getByRole('group', { name: 'Header Density' }),
    ).not.toBeNull();
  });

  it('names the level a cleared row density falls back to', () => {
    renderSection({ defaults: { density: 'spacious' } });

    expect(
      screen.getByRole('radio', { name: 'Default (Spacious)' }),
    ).not.toBeNull();
    expect(checkedIn('Row Density')).toBe('default');
  });

  it('offers the header the rows level when nothing sets a header default', () => {
    renderSection();

    expect(screen.getByRole('radio', { name: 'Same as rows' })).not.toBeNull();
    expect(checkedIn('Header Density')).toBe('default');
  });

  it('names the header default when the table or Global Settings sets one', () => {
    renderSection({ defaults: { headerDensity: 'dense' } });

    expect(
      screen.getByRole('radio', { name: 'Default (Dense)' }),
    ).not.toBeNull();
  });

  it('checks the levels the table holds of its own', () => {
    renderSection({
      defaults: { density: 'dense' },
      metaState: { density: 'comfortable', headerDensity: 'spacious' },
    });

    expect(checkedIn('Row Density')).toBe('comfortable');
    expect(checkedIn('Header Density')).toBe('spacious');
  });

  it('enables the density options unless the table is busy', () => {
    renderSection();

    expect(radios().every((radio) => radio.matches(':enabled'))).toBe(true);

    cleanup();
    renderSection({ isBusy: true });

    expect(radios().every((radio) => radio.matches(':disabled'))).toBe(true);
  });

  it('stages a chosen level without touching the rows', () => {
    renderSection();

    fireEvent.click(
      within(screen.getByRole('group', { name: 'Row Density' })).getByRole(
        'radio',
        { name: 'Dense' },
      ),
    );

    expect(checkedIn('Row Density')).toBe('dense');
    expect(
      screen.getByTitle('body-row').style.getPropertyValue('--x-height'),
    ).toBe('32px');
  });
});
