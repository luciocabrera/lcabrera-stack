import type { ReactNode } from 'react';

import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { BooleanField } from '@repo/ui/components/Form/fields/BooleanField/BooleanField.component';
import { CustomField } from '@repo/ui/components/Form/fields/CustomField/CustomField.component';
import { DateField } from '@repo/ui/components/Form/fields/DateField/DateField.component';
import { NumberField } from '@repo/ui/components/Form/fields/NumberField/NumberField.component';
import { RadioField } from '@repo/ui/components/Form/fields/RadioField/RadioField.component';
import { SelectField } from '@repo/ui/components/Form/fields/SelectField/SelectField.component';
import { TextField } from '@repo/ui/components/Form/fields/TextField/TextField.component';

export type AnyFieldComponent = (props: {
  readonly field: LeafFieldDef<Record<string, unknown>>;
}) => ReactNode;

/**
 * Registry dispatch, not a switch — adding a leaf type is a new entry here,
 * not a growing conditional (ADR-005). Each concrete field component is
 * generic over its own `TValues`; erased to `AnyFieldComponent` at the
 * registry boundary and narrowed back inside each leaf via its own
 * `field.type`-specific def.
 */
export const fieldRegistry: Record<
  LeafFieldDef<Record<string, unknown>>['type'],
  AnyFieldComponent
> = {
  boolean: BooleanField as AnyFieldComponent,
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
