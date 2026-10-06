type MockVariantToolbarProps = {
  readonly isBusy?: boolean;
  readonly variant?: 'footer' | 'toolbar';
};

export const createMockVariantToolbar =
  (testId: string) =>
  ({ isBusy = false, variant = 'footer' }: MockVariantToolbarProps) => (
    <div data-testid={testId}>
      {variant}:{String(isBusy)}
    </div>
  );
