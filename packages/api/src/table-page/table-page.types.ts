export type TablePageResponseShape = {
  readonly data: readonly unknown[];
  readonly error?: TaggedPayload;
  readonly groupingWarning?: TaggedPayload;
  readonly hasMore: boolean;
  /** Present on the first page of a read, absent on a load-more. */
  readonly total?: number;
};

export type TaggedPayload = {
  readonly kind: string;
};
