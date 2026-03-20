import * as stylex from '@stylexjs/stylex';

import type { RadioOptionGroupProps } from './RadioOptionGroup.types';

import { styles } from './RadioOptionGroup.stylex';

export const RadioOptionGroup = <TValue extends string>({
  name,
  onChange,
  options,
  value,
}: RadioOptionGroupProps<TValue>) => (
  <div {...stylex.props(styles.container)}>
    {options.map((option) => (
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
          checked={value === option.value}
          name={name}
          onChange={() => {
            onChange(option.value);
          }}
          type='radio'
          value={option.value}
        />
        <span>
          <span {...stylex.props(styles.label)}>{option.label}</span>
          {option.description && (
            <>
              <br />
              <span {...stylex.props(styles.description)}>
                {option.description}
              </span>
            </>
          )}
        </span>
      </label>
    ))}
  </div>
);
