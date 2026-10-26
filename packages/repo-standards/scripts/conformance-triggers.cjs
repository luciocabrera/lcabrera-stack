/**
 * Description quality, at the only tier a script can judge: is the description
 * long enough to carry a situation, does it name something concrete, does it
 * say when the artifact applies rather than what it is, and does it stop short
 * of claiming every task.
 *
 * Why: an agent selects a skill or subagent from its description alone, so a
 * label like "code quality helper" never triggers and reads, in a usage report,
 * exactly like an artifact nobody needed, while one that claims any task
 * crowds out every other artifact. Judgement of a description that
 * clears this floor is the model-in-the-loop tier, not this one.
 * Usage: `require('./conformance-triggers.cjs').descriptionFindings(...)`.
 */
'use strict';

const { KINDS } = require('./conformance-artifacts.cjs');

const MINIMUM_DESCRIPTION_WORDS = 12;

const TRIGGER_PATTERN =
  /\b(when|whenever|before|after|while|applies to|triggers on|invoked? as|dispatched by|use for)\b/i;

const CONCRETE_TOKEN =
  /`[^`]+`|[\w@.-]\/[\w@.-]|\w\.[a-z]{2,5}\b|\b[A-Z]\w|\d|\w-\w/;

const CONJUNCTION_SLASH = /\b(?:and\/or|or\/and)\b/gi;

const QUANTIFIERS = new Set(['all', 'any', 'every']);

const TASK_NOUNS = new Set([
  'change',
  'changes',
  'job',
  'jobs',
  'prompt',
  'prompts',
  'question',
  'questions',
  'request',
  'requests',
  'situation',
  'situations',
  'task',
  'tasks',
  'thing',
  'things',
  'work',
]);

const FILE_NOUNS = new Set(['file', 'files']);

const KIND_WORDS = new Set(['kind', 'kinds']);

const SCOPE_WORDS = new Set([
  'at',
  'below',
  'beneath',
  'from',
  'in',
  'inside',
  'matching',
  'named',
  'of',
  'that',
  'under',
  'which',
  'whose',
  'within',
]);

const OPEN_ENDED_PHRASES = [
  'anything else',
  'everything else',
  'at all',
  'no matter what',
  'whatever you',
  'whatever the user',
].map((phrase) => phrase.split(' '));

const TOKEN = /[a-z]+|[^\sa-z]/g;

const SENTENCE_START = /(^|[.!?:;—]\s+)([A-Z])/g;

/**
 * @param {string} description
 * @returns {string}
 */
const withoutConjunctionSlashes = (description) =>
  description.replaceAll(CONJUNCTION_SLASH, ' ');

/**
 * @param {string} description
 * @returns {string}
 */
const withoutSentenceInitialCapitals = (description) =>
  description.replaceAll(
    SENTENCE_START,
    (_match, lead, letter) => `${lead}${letter.toLowerCase()}`,
  );

/**
 * @param {readonly string[]} tokens
 * @param {number} index
 * @returns {number}
 */
const nounIndexAfter = (tokens, index) => {
  if (tokens[index] === 'other') {
    return index + 1;
  }
  return KIND_WORDS.has(tokens[index]) && tokens[index + 1] === 'of'
    ? index + 2
    : index;
};

/**
 * @param {readonly string[]} tokens
 * @param {number} index
 * @returns {string | undefined}
 */
const quantifiedPhrase = (tokens, index) => {
  const nounIndex = nounIndexAfter(tokens, index + 1);
  const noun = tokens[nounIndex] ?? '';
  const isUnscopedFile =
    FILE_NOUNS.has(noun) && !SCOPE_WORDS.has(tokens[nounIndex + 1] ?? '');
  const isClaim =
    QUANTIFIERS.has(tokens[index] ?? '') &&
    (isUnscopedFile || TASK_NOUNS.has(noun));
  return isClaim ? tokens.slice(index, nounIndex + 1).join(' ') : undefined;
};

/**
 * @param {readonly string[]} tokens
 * @param {number} index
 * @returns {string | undefined}
 */
const openEndedPhrase = (tokens, index) =>
  OPEN_ENDED_PHRASES.find((phrase) =>
    phrase.every((word, offset) => tokens[index + offset] === word),
  )?.join(' ');

/**
 * @param {string} description
 * @returns {string | undefined}
 */
const universalScope = (description) => {
  const tokens = description.toLowerCase().match(TOKEN) ?? [];
  return tokens
    .map(
      (_token, index) =>
        quantifiedPhrase(tokens, index) ?? openEndedPhrase(tokens, index),
    )
    .find((phrase) => phrase !== undefined);
};

/**
 * @param {string} description
 * @returns {number}
 */
const wordCount = (description) =>
  description.split(/\s+/).filter((word) => word.length > 0).length;

/**
 * @param {{
 *   kind: string;
 *   label: string;
 *   parsed: { frontmatter: Record<string, string> } | null;
 * }} artifact
 * @returns {readonly { kind: string, label: string, message: string }[]}
 */
const descriptionFindings = (artifact) => {
  if (KINDS[artifact.kind]?.triggerField !== 'description') {
    return [];
  }

  const description = artifact.parsed?.frontmatter.description ?? '';
  if (description.trim().length === 0) {
    return [];
  }

  const words = wordCount(description);
  const claimedScope = universalScope(description);
  const finding = (reason) => ({
    kind: artifact.kind,
    label: artifact.label,
    message: `Vague description in ${artifact.label}: ${reason}`,
  });

  return [
    ...(words < MINIMUM_DESCRIPTION_WORDS
      ? [
          finding(
            `${words} words is under the ${MINIMUM_DESCRIPTION_WORDS}-word floor`,
          ),
        ]
      : []),
    ...(CONCRETE_TOKEN.test(
      withoutConjunctionSlashes(withoutSentenceInitialCapitals(description)),
    )
      ? []
      : [
          finding('names nothing concrete — no path, command or named subject'),
        ]),
    ...(TRIGGER_PATTERN.test(description)
      ? []
      : [
          finding(
            'names no situation that selects it — say when it applies, what it follows, or what dispatches it',
          ),
        ]),
    ...(claimedScope === undefined
      ? []
      : [
          finding(
            `"${claimedScope}" would select it for every task — name the situation that sets it apart`,
          ),
        ]),
  ];
};

module.exports = {
  descriptionFindings,
};
