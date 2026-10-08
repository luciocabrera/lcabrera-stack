type TokenOffsetsArgs = {
  readonly text: string;
  readonly token: string;
};

const WORD_CHARACTER = /\w/u;

export const tokenOffsets = ({ text, token }: TokenOffsetsArgs) =>
  token === ''
    ? []
    : text
        .split(token)
        .slice(0, -1)
        .reduce<number[]>((offsets, part) => {
          const previous = offsets.at(-1);

          offsets.push(
            previous === undefined
              ? part.length
              : previous + token.length + part.length,
          );

          return offsets;
        }, [])
        .filter(
          (start) =>
            !WORD_CHARACTER.test(text.charAt(start - 1)) &&
            !WORD_CHARACTER.test(text.charAt(start + token.length)),
        );
