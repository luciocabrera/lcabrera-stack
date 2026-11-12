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

afterEach(cleanup);

describe('TitleBarDensitySection', () => {
  it('offers the title bar levels in a fieldset that is enabled by default', () => {
    renderSection();

    expect(
      screen
        .getByRole<HTMLFieldSetElement>('group', { name: 'Title bar' })
        .hasAttribute('disabled'),
    ).toBe(false);
  });

  it('disables its fieldset while the table is busy', () => {
    renderSection({ isBusy: true });

    expect(
      screen
        .getByRole<HTMLFieldSetElement>('group', { name: 'Title bar' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('renders nothing when the table has no title bar', () => {
    const { container } = renderSection({ features: { toolbar: false } });

    expect(container.childElementCount).toBe(0);
  });
});
