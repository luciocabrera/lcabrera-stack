import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import type { RadioOptionGroupProps } from './RadioOptionGroup.types';

import { styles } from './RadioOptionGroup.stylex';

export const RadioOptionGroup = <TValue extends string>({
  name,
  onChange,
  options,
  value,
}: RadioOptionGroupProps<TValue>) => {
  const groupId = useId();

  return (
    <div {...stylex.props(styles.container)}>
      {options.map((option, index) => {
        const optionId = `${groupId}-option-${index}`;
        const descriptionId = `${optionId}-description`;
        const labelId = `${optionId}-label`;

        return (
          <label
            key={option.value}
            {...stylex.props(
              styles.option,
              value === option.value && styles.optionSelected,
            )}
          >
            <input
              {...stylex.props(
                styles.radio,
                value === option.value && styles.radioChecked,
              )}
              aria-describedby={option.description ? descriptionId : undefined}
              aria-labelledby={labelId}
              checked={value === option.value}
              name={name}
              onChange={() => {
                onChange(option.value);
              }}
              type='radio'
              value={option.value}
            />
            <span>
              <span id={labelId} {...stylex.props(styles.label)}>
                {option.label}
              </span>
              {option.description && (
                <>
                  <br />
                  <span
                    id={descriptionId}
                    {...stylex.props(styles.description)}
                  >
                    {option.description}
                  </span>
                </>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
};
