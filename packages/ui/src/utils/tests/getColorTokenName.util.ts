import { colors } from '#ui/design-system/tokens/colors.stylex';

export const getColorTokenName = (tokenValue: string) => {
  const name = Object.entries(colors).find(
    ([, value]) => value === tokenValue,
  )?.[0];

  if (name === undefined) {
    throw new Error(`${tokenValue} is not a colour token`);
  }

  return name;
};
