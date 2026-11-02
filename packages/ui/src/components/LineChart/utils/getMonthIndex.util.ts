export const getMonthIndex = (time: number) => {
  const date = new Date(time);

  return date.getUTCFullYear() * 12 + date.getUTCMonth();
};
