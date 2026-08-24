import type { ReactNode } from 'react';

import type { LeafFieldDef } from '#ui/components/Form/Form.types';

import { BooleanField } from '#ui/components/Form/fields/BooleanField/BooleanField.component';
import { CurrencyField } from '#ui/components/Form/fields/CurrencyField/CurrencyField.component';
import { CustomField } from '#ui/components/Form/fields/CustomField/CustomField.component';
import { DateField } from '#ui/components/Form/fields/DateField/DateField.component';
import { NumberField } from '#ui/components/Form/fields/NumberField/NumberField.component';
import { RadioField } from '#ui/components/Form/fields/RadioField/RadioField.component';
import { SelectField } from '#ui/components/Form/fields/SelectField/SelectField.component';
import { TextField } from '#ui/components/Form/fields/TextField/TextField.component';

export type AnyFieldComponent = (props: {
  readonly field: LeafFieldDef<Record<string, unknown>>;
}) => ReactNode;

/**
 * Registry dispatch, not a switch — adding a leaf type is a new entry here, not a growing
 * conditional (ADR-005).
 */
export const fieldRegistry: Record<
  LeafFieldDef<Record<string, unknown>>['type'],
  AnyFieldComponent
> = {
  boolean: BooleanField as AnyFieldComponent,
  currency: CurrencyField as AnyFieldComponent,
  custom: CustomField as AnyFieldComponent,
  date: DateField as AnyFieldComponent,
  datetime: DateField as AnyFieldComponent,
  email: TextField as AnyFieldComponent,
  number: NumberField as AnyFieldComponent,
  password: TextField as AnyFieldComponent,
  radio: RadioField as AnyFieldComponent,
  select: SelectField as AnyFieldComponent,
  text: TextField as AnyFieldComponent,
  textarea: TextField as AnyFieldComponent,
};
