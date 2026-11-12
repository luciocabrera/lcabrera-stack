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
  TableFeatures,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { TableDensityContext } from '#ui/components/Table/contexts/TableConfig/TableDensityContext.context';
import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';
import { TableRow } from '#ui/components/Table/TableRow';
import { resolveTablePresentation } from '#ui/components/Table/utils/resolveTablePresentation.util';

import { TableDrawerProvider } from '../TableDrawerContext/TableDrawerContext.provider';
import { DisplaySettingsSection } from './DisplaySettingsSection.component';

type RenderSectionArgs = {
  readonly defaults?: TableDensityDefaults;
  readonly features?: TableFeatures;
  readonly isBusy?: boolean;
  readonly metaState?: Partial<TableMetaState>;
};

const renderSection = ({
  defaults = {},
  features,
  isBusy,
  metaState = {},
}: RenderSectionArgs = {}) =>
  render(
    <TableConfigProvider columnsState={{ columns: [] }} metaState={metaState}>
      <TableDensityContext value={defaults}>
        <TablePresentationContext
          value={resolveTablePresentation({ features })}
        >
          <TableDrawerProvider>
            <DisplaySettingsSection isBusy={isBusy} />
          </TableDrawerProvider>
        </TablePresentationContext>
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

type RadioInArgs = {
  readonly group: string;
  readonly name: string;
};

const radioIn = ({ group, name }: RadioInArgs) =>
  within(screen.getByRole('group', { name: group })).getByRole('radio', {
    name,
  });

const radios = () => screen.getAllByRole<HTMLInputElement>('radio');

afterEach(cleanup);

describe('DisplaySettingsSection', () => {
  it('holds the width presets, then the density of the rows, column headers and title bar', () => {
    renderSection();

    expect(
      screen.getByRole('heading', { name: 'Column Widths' }),
    ).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Density' })).not.toBeNull();
    expect(
      screen
        .getAllByRole('group')
        .map((group) => group.querySelector('legend')?.textContent),
    ).toStrictEqual(['Rows', 'Column headers', 'Title bar']);
  });

  it('leaves the title bar out when the table has none', () => {
    renderSection({ features: { toolbar: false } });

    expect(screen.queryByRole('group', { name: 'Title bar' })).toBeNull();
    expect(
      screen.getByRole('group', { name: 'Column headers' }),
    ).not.toBeNull();
  });

  it('names the level a cleared row density falls back to', () => {
    renderSection({ defaults: { density: 'spacious' } });

    expect(
      screen.getByRole('radio', { name: 'Default (Spacious)' }),
    ).not.toBeNull();
    expect(checkedIn('Rows')).toBe('default');
  });

  it('offers the column headers and the title bar the rows level when nothing sets their default', () => {
    renderSection();

    expect(
      radioIn({ group: 'Column headers', name: 'Same as rows' }),
    ).not.toBeNull();
    expect(checkedIn('Column headers')).toBe('default');
    expect(
      radioIn({ group: 'Title bar', name: 'Same as rows' }),
    ).not.toBeNull();
    expect(checkedIn('Title bar')).toBe('default');
  });

  it('describes row and column header levels by height and title bar levels by name', () => {
    renderSection();

    expect(screen.getByText('24px rows')).not.toBeNull();
    expect(screen.getByText('24px tall')).not.toBeNull();
    expect(
      radioIn({ group: 'Title bar', name: 'Dense' }).getAttribute(
        'aria-describedby',
      ),
    ).toBeNull();
  });

  it('names the header default when the table or Global Settings sets one', () => {
    renderSection({
      defaults: { headerDensity: 'dense', titleDensity: 'spacious' },
    });

    expect(
      radioIn({ group: 'Column headers', name: 'Default (Dense)' }),
    ).not.toBeNull();
    expect(
      radioIn({ group: 'Title bar', name: 'Default (Spacious)' }),
    ).not.toBeNull();
  });

  it('checks the levels the table holds of its own', () => {
    renderSection({
      defaults: { density: 'dense' },
      metaState: {
        density: 'comfortable',
        headerDensity: 'spacious',
        titleDensity: 'dense',
      },
    });

    expect(checkedIn('Rows')).toBe('comfortable');
    expect(checkedIn('Column headers')).toBe('spacious');
    expect(checkedIn('Title bar')).toBe('dense');
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

    fireEvent.click(radioIn({ group: 'Rows', name: 'Dense' }));
    fireEvent.click(radioIn({ group: 'Title bar', name: 'Spacious' }));

    expect(checkedIn('Rows')).toBe('dense');
    expect(checkedIn('Title bar')).toBe('spacious');
    expect(
      screen.getByTitle('body-row').style.getPropertyValue('--x-height'),
    ).toBe('32px');
  });
});
