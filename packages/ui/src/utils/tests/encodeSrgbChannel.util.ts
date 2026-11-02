export const encodeSrgbChannel = (linear: number) => {
  const clamped = Math.min(1, Math.max(0, linear));

  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
};
