type InSequenceArgs<Item, Result> = {
  readonly items: readonly Item[];
  readonly step: (item: Item) => Promise<Result>;
};

export const inSequence = async <Item, Result>({
  items,
  step,
}: InSequenceArgs<Item, Result>) => {
  const results: Result[] = [];

  for (const item of items) {
    results.push(await step(item));
  }

  return results;
};
