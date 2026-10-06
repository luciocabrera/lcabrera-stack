type InSequenceArgs<Item, Result> = {
  readonly items: readonly Item[];
  readonly step: (item: Item) => Promise<Result>;
};

export const inSequence = async <Item, Result>({
  items,
  step,
}: InSequenceArgs<Item, Result>) =>
  items.reduce<Promise<readonly Result[]>>(
    async (previous, item) => [...(await previous), await step(item)],
    Promise.resolve([]),
  );
