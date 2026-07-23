// @vitest-environment jsdom

import type {
  CustomFieldDef,
  RenderFieldArgs,
} from '@lcabrera/ui/components/Form/Form.types';

import {
  FormProvider,
  useGetFieldValue,
} from '@lcabrera/ui/components/Form/contexts';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CustomField } from './CustomField.component';

type Values = { readonly nickname: string };

afterEach(cleanup);

const renderCustomField = (field: CustomFieldDef<Values>) =>
  render(
    <FormProvider<Values> cancelTo='/' fields={[field]} mode='create'>
      <CustomField<Values> field={field} />
      <Probe />
    </FormProvider>,
  );

const asText = (value: unknown) => (typeof value === 'string' ? value : '');

const Probe = () => {
  const value = useGetFieldValue<Values>('nickname');

  return <output>{asText(value)}</output>;
};

const renderTextControl = ({
  isDisabled,
  onChange,
  value,
}: RenderFieldArgs) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <input
      aria-label='nickname-control'
      disabled={isDisabled}
      onChange={handleChange}
      value={asText(value)}
    />
  );
};

describe('CustomField', () => {
  it('renders the consumer-provided control inside the field chrome', () => {
    renderCustomField({
      accessor: 'nickname',
      label: 'Nickname',
      renderField: renderTextControl,
      type: 'custom',
    });

    expect(screen.getByText('Nickname')).not.toBeNull();
    expect(screen.getByLabelText('nickname-control')).not.toBeNull();
  });

  it('threads the store setter through onChange so the custom control is controlled', () => {
    renderCustomField({
      accessor: 'nickname',
      label: 'Nickname',
      renderField: renderTextControl,
      type: 'custom',
    });

    fireEvent.change(screen.getByLabelText('nickname-control'), {
      target: { value: 'ace' },
    });

    expect(screen.getByRole('status').textContent).toBe('ace');
  });

  it('passes the disabled flag through to the custom control in view mode', () => {
    render(
      <FormProvider<Values>
        cancelTo='/'
        fields={[
          {
            accessor: 'nickname',
            label: 'Nickname',
            renderField: renderTextControl,
            type: 'custom',
          },
        ]}
        mode='view'
      >
        <CustomField<Values>
          field={{
            accessor: 'nickname',
            label: 'Nickname',
            renderField: renderTextControl,
            type: 'custom',
          }}
        />
      </FormProvider>,
    );

    expect(
      screen.getByLabelText<HTMLInputElement>('nickname-control').disabled,
    ).toBe(true);
  });
});
