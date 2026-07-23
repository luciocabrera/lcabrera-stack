// @vitest-environment jsdom

import type {
  FieldErrors,
  FormMode,
  NumberFieldDef,
} from '@lcabrera/ui/components/Form/Form.types';

import {
  FormProvider,
  useGetFieldValue,
} from '@lcabrera/ui/components/Form/contexts';
import { useGetIsFormDirty } from '@lcabrera/ui/components/Form/contexts/FormContext/selectors/useGetIsFormDirty.hook';
import { formInputStyles } from '@lcabrera/ui/components/Form/fields/formInput.stylex';
import * as stylex from '@stylexjs/stylex';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { NumberField } from './NumberField.component';

afterEach(() => {
  cleanup();
});

type RenderNumberFieldArgs = {
  readonly field: NumberFieldDef<Values>;
  readonly initialValues?: Partial<Values>;
  readonly mode?: FormMode;
  readonly registerField?: boolean;
  readonly serverErrors?: FieldErrors<Values>;
};

type Values = { readonly amount: number; readonly quantity: number };

/**
 * Reports the live store value and its runtime type, so the tests can assert
 * that `handleChange` stores a real `number` (not the input's raw string) and
 * a real `undefined` (not an empty string) — neither is observable from the
 * rendered input alone.
 */
const ValueProbe = ({ accessor }: { readonly accessor: keyof Values }) => {
  const value = useGetFieldValue<Values>(accessor);

  return <output>{`${typeof value}:${String(value)}`}</output>;
};

/**
 * Reports live dirty state. Uses a `data-testid` rather than another `<output>`
 * so it does not collide with `ValueProbe`'s `status` role.
 */
const DirtyProbe = () => {
  const isDirty = useGetIsFormDirty<Values>(['amount']);

  return <p data-testid='dirty'>{String(isDirty)}</p>;
};

const renderNumberField = ({
  field,
  initialValues,
  mode = 'create',
  registerField = true,
  serverErrors,
}: RenderNumberFieldArgs) => {
  return render(
    <FormProvider<Values>
      cancelTo='/'
      fields={registerField ? [field] : []}
      initialValues={initialValues}
      mode={mode}
      serverErrors={serverErrors}
    >
      <NumberField<Values> field={field} />
      <ValueProbe accessor={field.accessor} />
    </FormProvider>,
  );
};

const getAmountInput = () =>
  screen.getByRole<HTMLInputElement>('spinbutton', { name: /Amount/ });

describe('NumberField', () => {
  it('renders a labelled number input wired to the field accessor', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    const input = getAmountInput();
    expect(input.type).toBe('number');
    expect(input.name).toBe('amount');
  });

  it('renders the default value as an empty input', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    expect(getAmountInput().value).toBe('');
  });

  it('renders an undefined store value as an empty input', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
      registerField: false,
    });

    expect(screen.getByRole('status').textContent).toBe('undefined:undefined');
    expect(getAmountInput().value).toBe('');
  });

  it('stringifies an initial numeric value', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
      initialValues: { amount: 42 },
    });

    expect(getAmountInput().value).toBe('42');
  });

  it('renders a zero value as "0" rather than an empty input', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
      initialValues: { amount: 0 },
    });

    expect(getAmountInput().value).toBe('0');
  });

  it('stores a typed entry as a number, not the raw input string', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    fireEvent.change(getAmountInput(), { target: { value: '42' } });

    expect(screen.getByRole('status').textContent).toBe('number:42');
    expect(getAmountInput().value).toBe('42');
  });

  it('stores undefined when the input is cleared', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
      initialValues: { amount: 42 },
    });

    fireEvent.change(getAmountInput(), { target: { value: '' } });

    expect(screen.getByRole('status').textContent).toBe('undefined:undefined');
    expect(getAmountInput().value).toBe('');
  });

  it('applies min and max constraints from clientValidation', () => {
    renderNumberField({
      field: {
        accessor: 'amount',
        clientValidation: { max: 100, min: 5 },
        label: 'Amount',
        type: 'number',
      },
    });

    const input = getAmountInput();
    expect(input.min).toBe('5');
    expect(input.max).toBe('100');
  });

  it('omits min and max when clientValidation is absent', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    const input = getAmountInput();
    expect(input.min).toBe('');
    expect(input.max).toBe('');
  });

  it('marks the input required and flags the label when required', () => {
    renderNumberField({
      field: {
        accessor: 'amount',
        clientValidation: { required: true },
        label: 'Amount',
        type: 'number',
      },
    });

    expect(getAmountInput().required).toBe(true);
    expect(screen.getByText('*', { exact: false })).not.toBeNull();
  });

  it('leaves the input optional when required is not set', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    expect(getAmountInput().required).toBe(false);
  });

  it('renders the placeholder when provided', () => {
    renderNumberField({
      field: {
        accessor: 'amount',
        label: 'Amount',
        placeholder: 'e.g. 100',
        type: 'number',
      },
    });

    expect(getAmountInput().placeholder).toBe('e.g. 100');
  });

  it('renders the description when there is no error', () => {
    renderNumberField({
      field: {
        accessor: 'amount',
        description: 'Total in euros',
        label: 'Amount',
        type: 'number',
      },
    });

    expect(screen.getByText('Total in euros')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('replaces the description with the error alert when the field has an error', () => {
    renderNumberField({
      field: {
        accessor: 'amount',
        description: 'Total in euros',
        label: 'Amount',
        type: 'number',
      },
      serverErrors: { amount: 'Amount is too large.' },
    });

    expect(screen.getByRole('alert').textContent).toBe('Amount is too large.');
    expect(screen.queryByText('Total in euros')).toBeNull();
  });

  it('disables the input in view mode', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
      mode: 'view',
    });

    expect(getAmountInput().disabled).toBe(true);
  });

  it('disables the input when the field definition is disabled', () => {
    renderNumberField({
      field: {
        accessor: 'amount',
        disabled: true,
        label: 'Amount',
        type: 'number',
      },
    });

    expect(getAmountInput().disabled).toBe(true);
  });

  it('keeps the input enabled in create mode for an enabled field', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    expect(getAmountInput().disabled).toBe(false);
  });

  it('opts the input out of browser autofill', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    expect(getAmountInput().autocomplete).toBe('one-time-code');
  });

  it('styles the input with the shared Form input token set', () => {
    renderNumberField({
      field: { accessor: 'amount', label: 'Amount', type: 'number' },
    });

    const inputClassName = stylex.props(formInputStyles.input).className ?? '';
    expect(inputClassName.length).toBeGreaterThan(0);

    const rendered = getAmountInput().className;
    const hasFormInputStyles = inputClassName
      .split(' ')
      .every((cls) => rendered.includes(cls));
    expect(hasFormInputStyles).toBe(true);
  });

  // Regression: the field initialised to `''` but stored `undefined` on clear,
  // so `'' !== undefined` left the form dirty forever — Save stayed enabled and
  // Cancel raised a spurious "Discard changes?" on a visibly untouched field.
  it('leaves the form pristine when a number is typed and then cleared', () => {
    const field: NumberFieldDef<Values> = {
      accessor: 'amount',
      label: 'Amount',
      type: 'number',
    };

    render(
      <FormProvider<Values> cancelTo='/' fields={[field]} mode='create'>
        <NumberField<Values> field={field} />
        <DirtyProbe />
      </FormProvider>,
    );

    expect(screen.getByTestId('dirty').textContent).toBe('false');

    fireEvent.change(getAmountInput(), { target: { value: '42' } });
    expect(screen.getByTestId('dirty').textContent).toBe('true');

    fireEvent.change(getAmountInput(), { target: { value: '' } });
    expect(screen.getByTestId('dirty').textContent).toBe('false');
  });
});
