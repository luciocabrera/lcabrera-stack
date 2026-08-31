type BuildOptionalNumericClausesArgs = {
  readonly clauses: readonly OptionalNumericClause[];
  readonly startParamIndex: number;
};

type NumericClauseAccumulator = {
  readonly paramIndex: number;
  readonly parts: readonly string[];
  readonly values: readonly number[];
};

type OptionalNumericClause = {
  readonly keyword: 'LIMIT' | 'OFFSET';
  readonly value: number | undefined;
};

type OptionalNumericClausesResult = {
  readonly text: string;
  readonly values: readonly number[];
};

export const buildOptionalNumericClauses = ({
  clauses,
  startParamIndex,
}: BuildOptionalNumericClausesArgs): OptionalNumericClausesResult => {
  const result = clauses.reduce<NumericClauseAccumulator>(
    (accumulator, clause) => {
      if (clause.value === undefined) {
        return accumulator;
      }

      return {
        paramIndex: accumulator.paramIndex + 1,
        parts: [
          ...accumulator.parts,
          `${clause.keyword} $${accumulator.paramIndex}`,
        ],
        values: [...accumulator.values, clause.value],
      };
    },
    { paramIndex: startParamIndex, parts: [], values: [] },
  );

  return { text: result.parts.join(' '), values: result.values };
};
