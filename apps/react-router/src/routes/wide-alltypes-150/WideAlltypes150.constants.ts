import type { TableColumn } from "@/components/Table/Table.types";
import type { WideAlltypes150 } from "@/services";

export const PERSISTENCE_KEY = "wide-alltypes-150-table";

// ─── Column helpers ──────────────────────────────────────────────────────────

type ColDataType = "boolean" | "date" | "number" | "string";

/**
 * Returns the display dataType for a column at the given index (1–149).
 * Types cycle as (index % 20):
 *   0,1,4,5 → number  |  2,3,7,8,9,10,11,12,13,14,15,16,17,18,19 → string
 *   6 → boolean  |  9 → date
 */
const getColDataType = (index: number): ColDataType => {
  const mod = index % 20;
  if (mod === 6) return "boolean";
  if (mod === 9) return "date";
  if (mod === 0 || mod === 1 || mod === 4 || mod === 5) return "number";
  return "string";
};

const PG_TYPE_LABELS: Readonly<Record<number, string>> = {
  0: "Smallint",
  1: "Integer",
  2: "Bigint",
  3: "Numeric",
  4: "Real",
  5: "Double",
  6: "Boolean",
  7: "Varchar",
  8: "Text",
  9: "Date",
  10: "Time",
  11: "Timestamp",
  12: "Timestamptz",
  13: "UUID",
  14: "JSONB",
  15: "Bytea",
  16: "Inet",
  17: "Interval",
  18: "Point",
  19: "Int[]",
};

// ─── Column definitions ───────────────────────────────────────────────────────

const ID_COLUMN: TableColumn<WideAlltypes150> = {
  dataType: "number",
  key: "id",
  label: "ID",
  minWidth: 80,
};

type BuildGeneratedColumnArgs = {
  readonly index: number;
};

const buildGeneratedColumn = ({
  index,
}: BuildGeneratedColumnArgs): TableColumn<WideAlltypes150> => {
  const mod = index % 20;
  const key = `c_${String(index).padStart(3, "0")}` as keyof WideAlltypes150;
  const typeLabel = PG_TYPE_LABELS[mod] ?? "Col";

  return {
    dataType: getColDataType(index),
    isFilterable: false,
    isSortable: mod !== 19, // integer[] columns are not meaningfully sortable
    key,
    label: `${typeLabel} ${index}`,
    minWidth: 130,
  } satisfies TableColumn<WideAlltypes150>;
};

const GENERATED_COLUMNS: TableColumn<WideAlltypes150>[] = [
  ...Array.from({ length: 149 }).keys(),
].map((zeroBasedIndex) => buildGeneratedColumn({ index: zeroBasedIndex + 1 }));

export const COLUMNS: TableColumn<WideAlltypes150>[] = [ID_COLUMN, ...GENERATED_COLUMNS];
