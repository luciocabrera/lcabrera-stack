// @vitest-environment jsdom

import type {
  FieldNode,
  LeafFieldDef,
} from '@repo/ui/components/Form/Form.types';

import { FormProvider } from '@repo/ui/components/Form/contexts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FormFieldDisplay } from './FormFieldDisplay.component';

afterEach(() => {
  cleanup();
});

type RenderDisplayArgs = {
  readonly field: LeafFieldDef<Values>;
  readonly initialValues: Partial<Values>;
};

type Values = {
  readonly total: number;
  readonly vip: boolean;
};

const renderDisplay = ({ field, initialValues }: RenderDisplayArgs) => {
  return render(
    <FormProvider<Values>
      cancelTo='/'
      fields={[field] as readonly FieldNode<Values>[]}
      initialValues={initialValues}
      mode='view'
    >
      <FormFieldDisplay<Values> field={field} />
    </FormProvider>,
  );
};

describe('FormFieldDisplay', () => {
  it('renders the label above the formatted value and no input widget', () => {
    renderDisplay({
      field: { accessor: 'total', label: 'Total', type: 'number' },
      initialValues: { total: 1234.5 },
    });

    expect(screen.getByText('Total')).not.toBeNull();
    expect(screen.getByText('1,234.5')).not.toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('renders Yes for a true boolean value', () => {
    renderDisplay({
      field: { accessor: 'vip', label: 'VIP', type: 'boolean' },
      initialValues: { vip: true },
    });

    expect(screen.getByText('Yes')).not.toBeNull();
  });

  it('renders an em dash placeholder when the value is empty', () => {
    renderDisplay({
      field: { accessor: 'total', label: 'Total', type: 'number' },
      initialValues: { total: undefined as unknown as number },
    });

    expect(screen.getByText('—')).not.toBeNull();
  });
});
