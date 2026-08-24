type IsCheckboxCheckedArgs = {
  readonly formData: FormData;
  readonly name: string;
};

/**
 * A bare presence check would read a crafted empty value as `true`, so this matches the
 * browser's own semantics — only `'on'` counts as checked, never a looser presence test.
 */
export const isCheckboxChecked = ({ formData, name }: IsCheckboxCheckedArgs) =>
  formData.get(name) === 'on';
