type ReadFormStringArgs = {
  readonly formData: FormData;
  readonly name: string;
};

/**
 * Read a named text value from FormData as a string, defaulting a missing
 * entry (or a `File` entry) to the empty string. Useful for reducing a raw
 * form payload to a plain string map before validation or coercion.
 */
export const readFormString = ({ formData, name }: ReadFormStringArgs) => {
  const value = formData.get(name);

  return typeof value === 'string' ? value : '';
};
