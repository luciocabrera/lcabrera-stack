type QuotedEndArgs = {
  readonly quote: string;
  readonly start: number;
  readonly text: string;
};

export const quotedEnd = ({ quote, start, text }: QuotedEndArgs) => {
  let index = start + 1;

  while (index < text.length) {
    if (text[index] === quote) {
      if (text[index + 1] !== quote) {
        return index + 1;
      }

      index += 2;
    } else {
      index += 1;
    }
  }

  return text.length;
};
