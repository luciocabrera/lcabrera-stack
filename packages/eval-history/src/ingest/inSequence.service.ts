type InSequenceArgs<Item, Result> = {
  readonly items: readonly Item[];
  readonly step: (item: Item) => Promise<Result>;
};

export const inSequence = async <Item, Result>({
  items,
  step,
}: InSequenceArgs<Item, Result>) =>
  items.reduce(async (previous, item) => {
    const results = await previous;

    results.push(await step(item));

    return results;
  }, Promise.resolve<Result[]>([]));
