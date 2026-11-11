// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableFeatures } from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';
import { resolveTablePresentation } from '#ui/components/Table/utils/resolveTablePresentation.util';

import { TableDrawerProvider } from '../../TableDrawerContext/TableDrawerContext.provider';
import { TitleBarDensitySection } from './TitleBarDensitySection.component';

type RenderSectionArgs = {
  readonly features?: TableFeatures;
  readonly isBusy?: boolean;
};

const renderSection = ({ features, isBusy }: RenderSectionArgs = {}) =>
  render(
    <TableConfigProvider columnsState={{ columns: [] }} metaState={{}}>
      <TablePresentationContext value={resolveTablePresentation({ features })}>
        <TableDrawerProvider>
          <TitleBarDensitySection isBusy={isBusy} />
        </TableDrawerProvider>
      </TablePresentationContext>
    </TableConfigProvider>,
  );

const radios = () => screen.getAllByRole<HTMLInputElement>('radio');

afterEach(cleanup);

describe('TitleBarDensitySection', () => {
  it('offers the title bar levels, enabled unless the table is busy', () => {
    renderSection();

    expect(screen.getByRole('group', { name: 'Title bar' })).not.toBeNull();
    expect(radios().every((radio) => radio.matches(':enabled'))).toBe(true);

    cleanup();
    renderSection({ isBusy: true });

    expect(radios().every((radio) => radio.matches(':disabled'))).toBe(true);
  });

  it('renders nothing when the table has no title bar', () => {
    const { container } = renderSection({ features: { toolbar: false } });

    expect(container.childElementCount).toBe(0);
  });
});
