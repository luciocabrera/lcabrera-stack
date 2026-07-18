// @vitest-environment jsdom

import type {
  FormMode,
  SelectFieldDef,
} from '@repo/ui/components/Form/Form.types';

import {
  FormProvider,
  useGetFieldValue,
} from '@repo/ui/components/Form/contexts';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SelectField } from './SelectField.component';

type Values = { readonly colors: string[]; readonly country: string };

const OPTIONS = [
  { label: 'Alpha', value: 'alpha' },
  { label: 'Bravo', value: 'bravo' },
] as const;

/** Reports the live store value so tests can assert what handleChange stored. */
const ValueProbe = ({ accessor }: { readonly accessor: keyof Values }) => {
  const value = useGetFieldValue<Values>(accessor);

  return <output>{JSON.stringify(value) ?? ''}</output>;
};

type RenderSelectFieldArgs = {
  readonly field: SelectFieldDef<Values>;
  readonly initialValues?: Partial<Values>;
  readonly mode?: FormMode;
};

const renderSelectField = ({
  field,
  initialValues,
  mode = 'create',
}: RenderSelectFieldArgs) =>
  render(
    <FormProvider<Values>
      cancelTo='/'
      fields={[field]}
      initialValues={initialValues}
      mode={mode}
    >
      <SelectField<Values> field={field} />
      <ValueProbe accessor={field.accessor} />
    </FormProvider>,
  );

const hiddenInputs = () => [
  ...document.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
];

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      public disconnect() {
        // noop
      }

      public observe() {
        // noop
      }

      public unobserve() {
        // noop
      }
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

describe('SelectField', () => {
  it('renders a labelled select trigger and no hidden inputs when nothing is selected', () => {
    renderSelectField({
      field: {
        accessor: 'country',
        label: 'Country',
        options: OPTIONS,
        type: 'select',
      },
    });

    expect(screen.getByText('Country')).not.toBeNull();
    expect(hiddenInputs()).toHaveLength(0);
  });

  it('mirrors an initial single-mode selection into one hidden input under the accessor name', () => {
    renderSelectField({
      field: {
        accessor: 'country',
        label: 'Country',
        options: OPTIONS,
        type: 'select',
      },
      initialValues: { country: 'bravo' },
    });

    const inputs = hiddenInputs();
    expect(inputs).toHaveLength(1);
    expect(inputs[0]?.name).toBe('country');
    expect(inputs[0]?.value).toBe('bravo');
  });

  it('mirrors an initial multi-mode selection into one hidden input per value', () => {
    renderSelectField({
      field: {
        accessor: 'colors',
        label: 'Colors',
        mode: 'multi',
        options: OPTIONS,
        type: 'select',
      },
      initialValues: { colors: ['alpha', 'bravo'] },
    });

    const inputs = hiddenInputs();
    expect(inputs).toHaveLength(2);
    expect(inputs.every((input) => input.name === 'colors')).toBe(true);
    expect(inputs.map((input) => input.value)).toEqual(['alpha', 'bravo']);
  });

  it('stores the picked option (not an array) in single mode', () => {
    renderSelectField({
      field: {
        accessor: 'country',
        label: 'Country',
        options: OPTIONS,
        type: 'select',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Select...' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    expect(screen.getByRole('status').textContent).toBe('"alpha"');
    expect(hiddenInputs().map((input) => input.value)).toEqual(['alpha']);
  });

  it('stores the full array of picks in multi mode', () => {
    renderSelectField({
      field: {
        accessor: 'colors',
        label: 'Colors',
        mode: 'multi',
        options: OPTIONS,
        type: 'select',
      },
      initialValues: { colors: ['alpha'] },
    });

    const trigger = document.querySelector('[aria-haspopup="listbox"]');
    if (trigger === null) {
      throw new Error('Expected the select trigger to exist');
    }

    fireEvent.click(trigger);

    const bravoRow = screen.getByText('Bravo').closest('label');
    if (bravoRow === null) {
      throw new Error('Expected the Bravo option row to exist');
    }

    fireEvent.click(within(bravoRow).getByRole('checkbox'));

    expect(screen.getByRole('status').textContent).toBe('["alpha","bravo"]');
  });

  it('disables the trigger in view mode', () => {
    renderSelectField({
      field: {
        accessor: 'country',
        label: 'Country',
        options: OPTIONS,
        type: 'select',
      },
      initialValues: { country: 'alpha' },
      mode: 'view',
    });

    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
  });
});
