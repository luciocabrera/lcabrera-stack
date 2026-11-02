type ReadCssNumberArgs = {
  readonly percentScale: number;
  readonly text: string;
};

export const readCssNumber = ({ percentScale, text }: ReadCssNumberArgs) =>
  text.endsWith('%')
    ? (Number(text.slice(0, -1)) / 100) * percentScale
    : Number(text);
