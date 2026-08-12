// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  CurrencyFieldDef,
  FormMode,
} from '#ui/components/Form/Form.types';

import { FormProvider, useGetFieldValue } from '#ui/components/Form/contexts';

import { CurrencyField } from './CurrencyField.component';

afterEach(() => {
  cleanup();
});

type Values = { readonly total: number };

const ValueProbe = () => {
  const value = useGetFieldValue<Values>('total');

  return <output>{`${typeof value}:${String(value)}`}</output>;
};

type RenderCurrencyFieldArgs = {
  readonly field: CurrencyFieldDef<Values>;
  readonly initialValues?: Partial<Values>;
  readonly mode?: FormMode;
};

const renderCurrencyField = ({
  field,
  initialValues,
  mode = 'create',
}: RenderCurrencyFieldArgs) => {
  return render(
    <FormProvider<Values>
      cancelTo='/'
      fields={[field]}
      initialValues={initialValues}
      mode={mode}
    >
      <CurrencyField<Values> field={field} />
      <ValueProbe />
    </FormProvider>,
  );
};

const getTotalInput = () =>
  screen.getByRole<HTMLInputElement>('spinbutton', { name: /Total/ });

describe('CurrencyField', () => {
  it('renders a number input wired to the field accessor with a currency symbol', () => {
    renderCurrencyField({
      field: { accessor: 'total', label: 'Total', type: 'currency' },
    });

    const input = getTotalInput();
    expect(input.type).toBe('number');
    expect(input.name).toBe('total');
    expect(screen.getByText('$')).not.toBeNull();
  });

  it('shows the symbol for the configured currency code', () => {
    renderCurrencyField({
      field: {
        accessor: 'total',
        currency: 'EUR',
        label: 'Total',
        type: 'currency',
      },
    });

    expect(screen.getByText('€')).not.toBeNull();
  });

  it('stores a typed entry as a number, not the raw input string', () => {
    renderCurrencyField({
      field: { accessor: 'total', label: 'Total', type: 'currency' },
    });

    fireEvent.change(getTotalInput(), { target: { value: '99.5' } });

    expect(screen.getByRole('status').textContent).toBe('number:99.5');
  });

  it('stringifies an initial numeric value', () => {
    renderCurrencyField({
      field: { accessor: 'total', label: 'Total', type: 'currency' },
      initialValues: { total: 42 },
    });

    expect(getTotalInput().value).toBe('42');
  });
});
