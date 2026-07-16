import * as stylex from '@stylexjs/stylex';

import type { FormFieldChromeProps } from './FormFieldChrome.types';

import { styles } from './FormFieldChrome.stylex';

export const FormFieldChrome = ({
  children,
  description,
  error,
  fieldId,
  hideLabel = false,
  isRequired = false,
  label,
}: FormFieldChromeProps) => {
  return (
    <div {...stylex.props(styles.container)}>
      {!hideLabel && (
        <label {...stylex.props(styles.label)} htmlFor={fieldId}>
          {label}
          {isRequired && <span {...stylex.props(styles.required)}> *</span>}
        </label>
      )}
      {children}
      {description && !error && (
        <p {...stylex.props(styles.description)}>{description}</p>
      )}
      {error && (
        <p role='alert' {...stylex.props(styles.error)}>
          {error}
        </p>
      )}
    </div>
  );
};
