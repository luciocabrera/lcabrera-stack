import type { TableColumn } from '../Table.types';

type InferredValueType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'number'
  | 'object'
  | 'string';

type InferTableColumnsFromJsonArgs = {
  readonly rows: readonly Record<string, unknown>[];
};

const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// `(x|)` is behaviorally identical to `(x)?` but avoids the
// optional-group-wrapping-a-quantifier shape that
// security/detect-unsafe-regex (safe-regex) rejects as backtracking-prone.
const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}|)(\.\d+|)([Z+-][\d:]*|)$/;

const isIsoDateString = (value: string) =>
  ISO_DATE_ONLY_PATTERN.test(value) || ISO_DATE_TIME_PATTERN.test(value);

const inferValueType = (value: unknown) => {
  if (Array.isArray(value)) {
    return 'array';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (typeof value === 'string') {
    return isIsoDateString(value) ? 'date' : 'string';
  }

  if (typeof value === 'object' && value !== null) {
    return 'object';
  }

  return 'string';
};

const humanizeKey = (key: string) =>
  key
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_-]+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());

type ObserveValueTypeArgs = {
  readonly key: string;
  readonly typeByKey: Map<string, InferredValueType>;
  readonly value: unknown;
};

const observeValueType = ({ key, typeByKey, value }: ObserveValueTypeArgs) => {
  if (value === undefined || value === null) {
    return;
  }

  const inferredType = inferValueType(value);
  const existingType = typeByKey.get(key);

  if (existingType === undefined) {
    typeByKey.set(key, inferredType);
  } else if (existingType !== inferredType) {
    // A column observed with conflicting types across rows falls back to
    // 'string' rather than silently picking one — mixed-shape JSON
    // (common across different scanners' raw output) renders as text
    // instead of guessing wrong.
    typeByKey.set(key, 'string');
  }
};

const toTableColumnDataType = (inferredType: InferredValueType) => {
  switch (inferredType) {
    case 'boolean': {
      return 'boolean';
    }
    case 'date': {
      return 'date';
    }
    case 'number': {
      return 'number';
    }
    case 'string': {
      return 'string';
    }
    default: {
      return;
    }
  }
};

/**
 * Computes TableColumn definitions from the union of keys across an
 * arbitrary array of JSON objects — the runtime counterpart to a
 * hand-authored `COLUMNS[]` constant. Intended to run server-side (a loader,
 * not a component) since it does no rendering itself; only complex
 * (object/array) columns get a `render`, and that render is a plain string
 * (a valid ReactNode) rather than JSX, so this file has no React dependency
 * and is safe to execute outside a browser/component context.
 */
export const inferTableColumnsFromJson = ({
  rows,
}: InferTableColumnsFromJsonArgs): readonly TableColumn<
  Record<string, unknown>
>[] => {
  const keyOrder: string[] = [];
  const seenKeys = new Set<string>();
  const typeByKey = new Map<string, InferredValueType>();

  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        keyOrder.push(key);
      }

      observeValueType({ key, typeByKey, value });
    }
  }

  return keyOrder.map((key) => {
    const inferredType = typeByKey.get(key) ?? 'string';
    const dataType = toTableColumnDataType(inferredType);
    const isComplex = inferredType === 'object' || inferredType === 'array';

    return {
      ...(dataType !== undefined && { dataType }),
      key,
      label: humanizeKey(key),
      // Without an explicit minWidth, an inferred column with a short
      // label (or an empty/short-valued column) collapses to little more
      // than its sort-icon width — a real, previously-caught issue in
      // hand-authored CQMS columns applies equally here.
      minWidth: 120,
      ...(isComplex && {
        render: (row: Record<string, unknown>) => JSON.stringify(row[key]),
      }),
    } satisfies TableColumn<Record<string, unknown>>;
  });
};
