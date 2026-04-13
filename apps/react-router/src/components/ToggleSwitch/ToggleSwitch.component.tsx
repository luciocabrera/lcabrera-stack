import type { ChangeEvent, FocusEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import { CheckIcon } from '@/components/Icons';
import { ICON_SIZE_XXS } from '@/design-system/constants';

import type { ToggleSwitchProps } from './ToggleSwitch.types.ts';

import { styles } from './ToggleSwitch.stylex.ts';

export const ToggleSwitch = ({
  isChecked,
  isDisabled,
  label,
  onChange,
  ...props
}: ToggleSwitchProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(event);
  };

  const generatedId = useId();
  const id = props.id ?? generatedId;

  return (
    <div {...stylex.props(styles.container)}>
      <label
        {...stylex.props(
          styles.track,
          isChecked && styles.trackChecked,
          isDisabled && styles.trackDisabled,
          isFocused && styles.trackFocus,
        )}
        htmlFor={id}
      >
        <input
          {...props}
          {...stylex.props(styles.input)}
          aria-checked={isChecked}
          checked={isChecked}
          disabled={isDisabled}
          id={id}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          role='switch'
          type='checkbox'
        />
        <span
          {...stylex.props(styles.thumb, isChecked && styles.thumbChecked)}
          aria-hidden='true'
        >
          {isChecked && <CheckIcon size={ICON_SIZE_XXS} />}
        </span>
      </label>
      {label && (
        <label
          {...stylex.props(styles.label, isDisabled && styles.labelDisabled)}
          htmlFor={id}
        >
          {label}
        </label>
      )}
    </div>
  );
};
