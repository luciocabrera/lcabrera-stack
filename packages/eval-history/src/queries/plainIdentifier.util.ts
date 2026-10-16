const IDENTIFIER = /^[a-z_][a-z\d_]*$/;

export const plainIdentifier = (name: string) => {
  if (!IDENTIFIER.test(name)) {
    throw new Error(`"${name}" is not a plain lower-case identifier`);
  }

  return name;
};
