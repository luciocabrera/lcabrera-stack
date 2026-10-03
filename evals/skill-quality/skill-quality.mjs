/**
 * Waza's `waza quality` judge rebuilt on the Claude Agent SDK: the same five
 * dimensions and the same prompt, and a parser that refuses a reply missing a
 * dimension or holding a score outside 1-5.
 * Usage: imported by verify-skill-quality.mjs.
 */
export const RUBRIC = [
  {
    description:
      'How clear and unambiguous are the instructions? Is the purpose immediately obvious? Are steps well-ordered and easy to follow?',
    name: 'clarity',
  },
  {
    description:
      'Does the skill cover all necessary aspects? Are edge cases addressed? Is there enough detail for the agent to succeed?',
    name: 'completeness',
  },
  {
    description:
      'Are USE FOR and DO NOT USE FOR triggers well-defined? Do they avoid overlap? Would they correctly route requests?',
    name: 'trigger_precision',
  },
  {
    description:
      'Does the skill define clear boundaries? Are capabilities and limitations explicit? Is the scope neither too broad nor too narrow?',
    name: 'scope_coverage',
  },
  {
    description:
      'Does the skill avoid common anti-patterns such as vague instructions, conflicting directives, missing error handling guidance, or overly prescriptive steps?',
    name: 'anti_patterns',
  },
];

export const judgePrompt = (skillContent) =>
  [
    'You are a skill quality judge. Evaluate the following SKILL.md content against each quality dimension.',
    '',
    'Score each dimension from 1 (poor) to 5 (excellent). Provide specific, actionable feedback for each.',
    '',
    'Quality dimensions:',
    ...RUBRIC.map(({ description, name }) => `- **${name}**: ${description}`),
    '',
    'Respond with ONLY a JSON object in this exact format (no markdown fences, no extra text):',
    '{',
    '  "dimensions": [',
    '    {"name": "<dimension_name>", "score": <1-5>, "feedback": "<specific feedback>"}',
    '  ],',
    '  "overall_score": <1.0-5.0>,',
    '  "summary": "<overall assessment>"',
    '}',
    '',
    'Important rules:',
    '- Include ALL dimensions listed above, in the same order',
    '- overall_score should be the weighted average of dimension scores',
    '- Keep feedback concise but actionable (1-2 sentences per dimension)',
    '- Be critical but fair — a score of 5 means exceptional quality',
    '',
    'SKILL.md content to evaluate:',
    '---',
    skillContent,
    '---',
  ].join('\n');

const FENCED = /```(?:json)?\s*([\s\S]*?)```/;

const jsonText = (reply) => (FENCED.exec(reply)?.[1] ?? reply).trim();

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return;
  }
};

const isScore = (score) => Number.isInteger(score) && score >= 1 && score <= 5;

const dimensionProblems = (byName) =>
  RUBRIC.flatMap(({ name }) => {
    if (!byName.has(name)) {
      return [`the reply has no "${name}" dimension`];
    }
    return isScore(byName.get(name).score)
      ? []
      : [`the "${name}" score is not a whole number from 1 to 5`];
  });

const mean = (numbers) =>
  numbers.reduce((sum, number) => sum + number, 0) / numbers.length;

const scored = (byName) =>
  RUBRIC.map(({ name }) => ({
    feedback: String(byName.get(name).feedback ?? ''),
    name,
    score: byName.get(name).score,
  }));

const judgementOf = ({ byName, summary }) => {
  const dimensions = scored(byName);
  return {
    dimensions,
    overall: mean(dimensions.map(({ score }) => score)),
    summary: String(summary ?? ''),
  };
};

const byNameOf = (dimensions) =>
  new Map(dimensions.map((dimension) => [dimension?.name, dimension]));

export const parseJudgement = (reply) => {
  const parsed = parseJson(jsonText(reply));
  if (!Array.isArray(parsed?.dimensions)) {
    return {
      problems: ['the reply is not the JSON object the prompt asks for'],
    };
  }
  const byName = byNameOf(parsed.dimensions);
  const problems = dimensionProblems(byName);
  return problems.length > 0
    ? { problems }
    : { judgement: judgementOf({ byName, summary: parsed.summary }), problems };
};

export const selectedSkills = ({ catalog, requested }) => {
  const unknown = requested.filter((name) => !catalog.includes(name));
  if (unknown.length > 0) {
    throw new Error(
      unknown
        .map((name) => `"${name}" is no skill in .github/skills/`)
        .join('\n'),
    );
  }
  return requested.length === 0 ? catalog : requested;
};

const HEADER = ['skill', ...RUBRIC.map(({ name }) => name), 'overall'];

const row = (cells) => `| ${cells.join(' | ')} |`;

const resultRow = ({ error, judgement, skill }) =>
  judgement === undefined
    ? row([skill, ...RUBRIC.map(() => '—'), `not judged: ${error}`])
    : row([
        skill,
        ...judgement.dimensions.map(({ score }) => String(score)),
        judgement.overall.toFixed(1),
      ]);

export const baselineTable = (results) =>
  [row(HEADER), row(HEADER.map(() => '---')), ...results.map(resultRow)].join(
    '\n',
  );
