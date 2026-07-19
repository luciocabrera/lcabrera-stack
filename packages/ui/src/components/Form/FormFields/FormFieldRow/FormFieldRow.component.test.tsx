// @vitest-environment jsdom

import type { RowFieldNode } from '@repo/ui/components/Form/Form.types';

import { FormProvider } from '@repo/ui/components/Form/contexts';
import { FormFieldsRendererContext } from '@repo/ui/components/Form/FormFields/contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldsList } from '@repo/ui/components/Form/FormFields/FormFieldsList/FormFieldsList.component';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FormFieldRow } from './FormFieldRow.component';

afterEach(() => {
  cleanup();
});

type Values = { readonly bio: string; readonly name: string };

const renderRow = (field: RowFieldNode<Values>) => {
  return render(
    <FormProvider<Values> cancelTo='/' fields={[field]} mode='create'>
      <FormFieldsRendererContext
        value={(nested) => <FormFieldsList fields={nested} />}
      >
        <FormFieldRow<Values> field={field} />
      </FormFieldsRendererContext>
    </FormProvider>,
  );
};

describe('FormFieldRow', () => {
  it('renders every field in the row', () => {
    renderRow({
      fields: [
        { accessor: 'name', label: 'Name', type: 'text' },
        { accessor: 'bio', label: 'Bio', type: 'textarea' },
      ],
      type: 'row',
    });

    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
    expect(screen.getByLabelText('Bio', { exact: false })).not.toBeNull();
  });

  it('renders a single-field row', () => {
    renderRow({
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      type: 'row',
    });

    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
  });

  it('renders every field and applies distinct per-cell widths when spans differ', () => {
    const { container } = renderRow({
      fields: [
        { accessor: 'name', label: 'Name', type: 'text' },
        { accessor: 'bio', label: 'Bio', type: 'textarea' },
      ],
      spans: [3, 1],
      type: 'row',
    });

    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
    expect(screen.getByLabelText('Bio', { exact: false })).not.toBeNull();

    const [first, second] = [
      ...(container.firstElementChild?.children ?? []),
    ] as HTMLElement[];
    // Dynamic StyleX writes the grow factor as an inline custom property, so a
    // span-3 cell resolves to different inline styling than the span-1 cell.
    expect(first?.getAttribute('style')).not.toBe(
      second?.getAttribute('style'),
    );
  });

  it('defaults to equal-width cells when spans are omitted', () => {
    const { container } = renderRow({
      fields: [
        { accessor: 'name', label: 'Name', type: 'text' },
        { accessor: 'bio', label: 'Bio', type: 'textarea' },
      ],
      type: 'row',
    });

    const [first, second] = [
      ...(container.firstElementChild?.children ?? []),
    ] as HTMLElement[];
    expect(first?.getAttribute('style')).toBe(second?.getAttribute('style'));
  });
});
