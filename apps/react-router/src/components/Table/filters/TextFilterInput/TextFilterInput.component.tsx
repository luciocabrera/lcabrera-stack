import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import type { TextFilterInputProps } from "./TextFilterInput.types.ts";

import { styles } from "./TextFilterInput.stylex.ts";

export const TextFilterInput = <TData,>({
  filter,
  onChange,
  operator,
}: TextFilterInputProps<TData>) => {
  const initialValue = filter?.value ?? "";
  const [value, setValue] = useState(initialValue);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange({ operator, type: "text", value: newValue });
  };

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.inputWrapper)}>
        <input
          autoComplete="one-time-code"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          data-lpignore="true"
          onChange={handleValueChange}
          placeholder="Enter text..."
          type="text"
          value={value}
          {...stylex.props(styles.input)}
        />
      </div>
    </div>
  );
};
