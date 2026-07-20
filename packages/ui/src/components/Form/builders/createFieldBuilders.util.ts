import type { ChoiceFieldArgs, ChoiceFieldType } from './choiceField.util';
import type { BaseFieldType, FieldArgs } from './field.util';
import type { FieldGroupArgs } from './fieldGroup.util';
import type { FieldRowArgs } from './fieldRow.util';
import type { ToggleFieldArgs } from './toggleField.util';

import { choiceField } from './choiceField.util';
import { field } from './field.util';
import { fieldGroup } from './fieldGroup.util';
import { fieldRow } from './fieldRow.util';
import { toggleField } from './toggleField.util';

/**
 * Bind the Form's value shape `TValues` once and return the field-tree builders
 * (`field`/`choiceField`/`toggleField`/`fieldRow`/`fieldGroup`) with it baked
 * in. A generic builder cannot infer `TValues` from a string `accessor`, so
 * without this factory every call would need explicit type arguments — binding
 * it here keeps `accessor` type-checked against the value keys while call sites
 * stay as terse as a hand-written field literal.
 *
 * @example
 * const { field, choiceField, fieldGroup } = createFieldBuilders<OrderValues>();
 * const tree = [fieldGroup({ label: 'Summary', fields: [
 *   field({ accessor: 'order_date', label: 'Date', required: true, type: 'date' }),
 * ] })];
 */
export const createFieldBuilders = <
  TValues extends Record<string, unknown>,
>() => ({
  choiceField: <T extends ChoiceFieldType>(args: ChoiceFieldArgs<TValues, T>) =>
    choiceField<TValues, T>(args),
  field: <T extends BaseFieldType>(args: FieldArgs<TValues, T>) =>
    field<TValues, T>(args),
  fieldGroup: (args: FieldGroupArgs<TValues>) => fieldGroup<TValues>(args),
  fieldRow: (args: FieldRowArgs<TValues>) => fieldRow<TValues>(args),
  toggleField: (args: ToggleFieldArgs<TValues>) => toggleField<TValues>(args),
});
