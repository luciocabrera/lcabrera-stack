type ComposeEventHandlersArgs<TEvent> = {
  readonly consumer: ((event: TEvent) => void) | undefined;
  readonly grid: (event: TEvent) => void;
};

export const composeEventHandlers = <TEvent>({
  consumer,
  grid,
}: ComposeEventHandlersArgs<TEvent>) =>
  consumer === undefined
    ? grid
    : (event: TEvent) => {
        consumer(event);
        grid(event);
      };
