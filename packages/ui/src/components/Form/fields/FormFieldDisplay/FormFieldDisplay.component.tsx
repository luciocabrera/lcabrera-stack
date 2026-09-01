import * as stylex from '@stylexjs/stylex';

import { useGetFieldValue } from '#ui/components/Form/contexts/FormContext/selectors';

import type { FormFieldDisplayProps } from './FormFieldDisplay.types';

import { styles } from './FormFieldDisplay.stylex';
import { formatFieldDisplayValue } from './utils';

export const FormFieldDisplay = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldDisplayProps<TValues>) => {
  const value = useGetFieldValue<TValues>(field.accessor);
  const displayValue = formatFieldDisplayValue({ field, value });

  return (
    <div {...stylex.props(styles.container)}>
      <span {...stylex.props(styles.label)}>{field.label}</span>
      <p {...stylex.props(styles.value)}>{displayValue || '—'}</p>
      {Boolean(field.description) && (
        <p {...stylex.props(styles.description)}>{field.description}</p>
      )}
    </div>
  );
};
