type IsCheckboxCheckedArgs = {
  readonly formData: FormData;
  readonly name: string;
};

export const isCheckboxChecked = ({ formData, name }: IsCheckboxCheckedArgs) =>
  formData.get(name) === 'on';
