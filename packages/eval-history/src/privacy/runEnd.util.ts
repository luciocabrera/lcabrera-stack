type RunEndArgs = {
  readonly matches: (character: string) => boolean;
  readonly start: number;
  readonly text: string;
};

export const runEnd = ({ matches, start, text }: RunEndArgs) => {
  let index = start;

  while (index < text.length && matches(text.charAt(index))) {
    index += 1;
  }

  return index;
};
