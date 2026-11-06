export const getMonthStart = (month: number) =>
  new Date(Date.UTC(Math.floor(month / 12), month % 12, 1));
