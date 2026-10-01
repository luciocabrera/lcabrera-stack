export const toIntegerRowId = (raw: string) => {
  const id = Number(raw);

  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};
