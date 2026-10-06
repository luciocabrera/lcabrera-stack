const HEX_COLOR = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const KEYWORD_COLOR = /^[a-z]+$/i;
const FUNCTION_COLOR =
  /^(?:color|color-mix|hsla?|hwb|lab|lch|light-dark|oklab|oklch|rgba?)\([^(){};]*\)$/i;

export const matchesCssColorSyntax = (value: string) => {
  const trimmed = value.trim();

  return (
    HEX_COLOR.test(trimmed) ||
    KEYWORD_COLOR.test(trimmed) ||
    FUNCTION_COLOR.test(trimmed)
  );
};
