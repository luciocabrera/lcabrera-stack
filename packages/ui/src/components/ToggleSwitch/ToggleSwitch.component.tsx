import type { ChangeEvent, FocusEvent } from 'react';

import { CheckIcon } from '@repo/ui/components/Icons';
import { ICON_SIZE_XXS } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';
import { useId, useState } from 'react';

import type { ToggleSwitchProps } from './ToggleSwitch.types';

import { busyStyles, styles } from './ToggleSwitch.stylex';

export const ToggleSwitch = ({
  isBusy = false,
  isChecked,
  isDisabled,
  label,
  onChange,
  ...props
}: ToggleSwitchProps) => {
  const isBusyState = isBusy;
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
          disabled={isDisabled || isBusyState}
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
      {isBusyState && (
        <div {...stylex.props(busyStyles.overlay)}>
          <div {...stylex.props(busyStyles.wave)} />
        </div>
      )}
    </div>
  );
};
