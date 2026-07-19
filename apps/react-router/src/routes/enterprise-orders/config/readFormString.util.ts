export type ReadFormStringArgs = {
  readonly formData: FormData;
  readonly name: string;
};

/**
 * Read a named text value from FormData as a string, defaulting a missing
 * entry (or a `File` entry) to the empty string. Keeps the raw form payload a
 * plain string map the Zod schema can coerce/validate.
 */
export const readFormString = ({ formData, name }: ReadFormStringArgs) => {
  const value = formData.get(name);

  return typeof value === 'string' ? value : '';
};
