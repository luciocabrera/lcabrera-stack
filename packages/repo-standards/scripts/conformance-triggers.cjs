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

const UNIVERSAL_SCOPE =
  /\b(?:(?:any|every|all)\s+(?:kinds?\s+of\s+|other\s+)?(?:tasks?|work|requests?|jobs?|situations?|questions?|prompts?|things?|changes?)\b|(?:any|every|all)\s+files?\b(?!\s+(?:under|within|matching|named)\b)|(?:anything|everything)\s+else\b|\bat\s+all\b|no\s+matter\s+what\b|whatever\s+(?:you|the\s+user)\b)/i;

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
  const universalScope = UNIVERSAL_SCOPE.exec(description)?.[0];
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
    ...(universalScope === undefined
      ? []
      : [
          finding(
            `"${universalScope}" would select it for every task — name the situation that sets it apart`,
          ),
        ]),
  ];
};

module.exports = {
  descriptionFindings,
};
