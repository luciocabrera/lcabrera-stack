type ReadFormStringArgs = {
  readonly formData: FormData;
  readonly name: string;
};

export const readFormString = ({ formData, name }: ReadFormStringArgs) => {
  const value = formData.get(name);

  return typeof value === 'string' ? value : '';
};
