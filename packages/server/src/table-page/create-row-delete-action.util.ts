export type CreateRowDeleteActionArgs<TId> = {
  readonly deleteRow: (id: TId) => Promise<unknown>;
  /** Returns `undefined` for a value that names no row, which is answered 400. */
  readonly parseId: (raw: string) => TId | undefined;
};

export type RowDeleteAction = (args: RowDeleteActionArgs) => Promise<Response>;

export type RowDeleteActionArgs = {
  readonly request: Request;
};

const DELETE_INTENT = 'delete';

const badRequest = (error: string) => Response.json({ error }, { status: 400 });

export const createRowDeleteAction =
  <TId>({
    deleteRow,
    parseId,
  }: CreateRowDeleteActionArgs<TId>): RowDeleteAction =>
  async ({ request }: RowDeleteActionArgs) => {
    const formData = await request.formData();

    if (formData.get('intent') !== DELETE_INTENT) {
      return badRequest('Unsupported action intent');
    }

    const raw = formData.get('id');

    if (typeof raw !== 'string' || raw.length === 0) {
      return badRequest('Missing row id');
    }

    const id = parseId(raw);

    if (id === undefined) return badRequest('Invalid row id');

    await deleteRow(id);

    return Response.json({ id, ok: true });
  };
