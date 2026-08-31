// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type {
  DateFieldDef,
  FieldErrors,
  FormMode,
} from '#ui/components/Form/Form.types';

import { FormProvider, useGetFieldValue } from '#ui/components/Form/contexts';

import { DateField } from './DateField.component';

afterEach(() => {
  cleanup();
});

type RenderDateFieldArgs = {
  readonly field: DateFieldDef<Values>;
  readonly initialValues?: Partial<Values>;
  readonly mode?: FormMode;
  readonly registerField?: boolean;
  readonly serverErrors?: FieldErrors<Values>;
};

type Values = { readonly birthday: string; readonly meetingAt: string };

const ValueProbe = ({ accessor }: { readonly accessor: keyof Values }) => {
  const value = useGetFieldValue<Values>(accessor);

  return <output>{`${typeof value}:${String(value)}`}</output>;
};

const renderDateField = ({
  field,
  initialValues,
  mode = 'create',
  registerField = true,
  serverErrors,
}: RenderDateFieldArgs) => {
  return render(
    <FormProvider<Values>
      cancelTo='/'
      fields={registerField ? [field] : []}
      initialValues={initialValues}
      mode={mode}
      serverErrors={serverErrors}
    >
      <DateField<Values> field={field} />
      <ValueProbe accessor={field.accessor} />
    </FormProvider>,
  );
};

const getBirthdayInput = () =>
  screen.getByLabelText<HTMLInputElement>('Birthday', { exact: false });

describe('DateField', () => {
  it('renders a date input wired to the field accessor for type "date"', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
    });

    const input = getBirthdayInput();
    expect(input.type).toBe('date');
    expect(input.name).toBe('birthday');
  });

  it('renders a datetime-local input for type "datetime"', () => {
    renderDateField({
      field: { accessor: 'meetingAt', label: 'Meeting at', type: 'datetime' },
    });

    const input = screen.getByLabelText<HTMLInputElement>('Meeting at', {
      exact: false,
    });
    expect(input.type).toBe('datetime-local');
    expect(input.name).toBe('meetingAt');
  });

  it('renders the initial value', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
      initialValues: { birthday: '2026-07-17' },
    });

    expect(getBirthdayInput().value).toBe('2026-07-17');
  });

  it('renders the empty-string default value as an empty input', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
    });

    expect(getBirthdayInput().value).toBe('');
  });

  it('falls back to an empty input when the store has no value for the accessor', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
      registerField: false,
    });

    expect(screen.getByRole('status').textContent).toBe('undefined:undefined');
    expect(getBirthdayInput().value).toBe('');
  });

  it('stores the picked date as a string', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
    });

    fireEvent.change(getBirthdayInput(), { target: { value: '2026-07-17' } });

    expect(screen.getByRole('status').textContent).toBe('string:2026-07-17');
    expect(getBirthdayInput().value).toBe('2026-07-17');
  });

  it('stores the picked datetime as a string', () => {
    renderDateField({
      field: { accessor: 'meetingAt', label: 'Meeting at', type: 'datetime' },
    });

    fireEvent.change(screen.getByLabelText('Meeting at', { exact: false }), {
      target: { value: '2026-07-17T10:30' },
    });

    expect(screen.getByRole('status').textContent).toBe(
      'string:2026-07-17T10:30',
    );
  });

  it('stores an empty string when the input is cleared', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
      initialValues: { birthday: '2026-07-17' },
    });

    fireEvent.change(getBirthdayInput(), { target: { value: '' } });

    expect(screen.getByRole('status').textContent).toBe('string:');
    expect(getBirthdayInput().value).toBe('');
  });

  it('marks the input required and flags the label when required', () => {
    renderDateField({
      field: {
        accessor: 'birthday',
        clientValidation: { required: true },
        label: 'Birthday',
        type: 'date',
      },
    });

    expect(getBirthdayInput().required).toBe(true);
    expect(screen.getByText('*', { exact: false })).not.toBeNull();
  });

  it('leaves the input optional when required is not set', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
    });

    expect(getBirthdayInput().required).toBe(false);
  });

  it('renders the description when there is no error', () => {
    renderDateField({
      field: {
        accessor: 'birthday',
        description: 'Date of birth',
        label: 'Birthday',
        type: 'date',
      },
    });

    expect(screen.getByText('Date of birth')).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('replaces the description with the error alert when the field has an error', () => {
    renderDateField({
      field: {
        accessor: 'birthday',
        description: 'Date of birth',
        label: 'Birthday',
        type: 'date',
      },
      serverErrors: { birthday: 'Birthday must be in the past.' },
    });

    expect(screen.getByRole('alert').textContent).toBe(
      'Birthday must be in the past.',
    );
    expect(screen.queryByText('Date of birth')).toBeNull();
  });

  it('disables the input in view mode', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
      mode: 'view',
    });

    expect(getBirthdayInput().disabled).toBe(true);
  });

  it('disables the input when the field definition is disabled', () => {
    renderDateField({
      field: {
        accessor: 'birthday',
        disabled: true,
        label: 'Birthday',
        type: 'date',
      },
    });

    expect(getBirthdayInput().disabled).toBe(true);
  });

  it('keeps the input enabled in create mode for an enabled field', () => {
    renderDateField({
      field: { accessor: 'birthday', label: 'Birthday', type: 'date' },
    });

    expect(getBirthdayInput().disabled).toBe(false);
  });
});
