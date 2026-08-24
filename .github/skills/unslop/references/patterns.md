# Patterns

Stop lists for Level 2. Read before touching a text. A single occurrence can
be fine; the problem is clusters that carry nothing. Test every hit: "what is
actually being said?" No answer: delete, don't paraphrase.

Lexical items expire. Habits (inflation, copula-avoidance, chewed conclusions)
do not. Target the habit.

This repo's real terms are not on this list. See SKILL.md Level 2.

---

## Content

**Inflated significance.** "stands as a testament", "plays a vital/key role",
"underscores its importance", "indelible mark", "pivotal moment", "setting
the stage for", "deeply rooted", "cannot be overstated".
Fix: the fact that makes the significance visible. No fact, no claim.

**Promotional tone.** "boasts", "vibrant", "nestled", "renowned",
"breathtaking", "groundbreaking", "cutting-edge", "seamlessly",
"rich heritage".
Fix: neutral description with a specific.

**Name-dropping.** A list of outlets with no quote. Pick one. Say what it said.

**Vague attributions.** "experts argue", "observers have noted", "industry
reports suggest", "widely regarded as", "some critics argue".
Fix: name the source (outlet, person, date) or drop the claim.

**Superficial -ing.** A participle bolted onto a fact, assigning it meaning:
"highlighting", "ensuring", "reflecting", "showcasing", "fostering",
"demonstrating the resilience of". Facts don't highlight. Split: fact, then
what follows (or nothing).

**Formulaic challenges.** "Despite these challenges, X continues to thrive."
"Challenges and Future Outlook". End where the substance ends. Real risks
get owners and magnitudes.

**Overgeneralized sourcing.** One review becomes "reviewers"; two articles
become "widespread coverage"; "and many more" the sources never supported.
Keep the count honest.

## Language

**AI vocabulary** (cluster, not one word). delve, tapestry (abstract),
landscape (abstract), pivotal, crucial, robust, meticulous, intricate,
showcase, underscore, garner, bolster, foster, testament, interplay,
vibrant, enduring, enhance, sentence-initial "Additionally". Grok-flavored:
causal, empirical, correlate (when they are dressing, not measuring).
Fix: the plain word.

**Copula avoidance.** "serves as", "stands as", "marks", "represents",
"features", "offers", "boasts", "refers to" for "is"/"has".
Fix: is, has. "X is…", not "X refers to…".

**Negative parallelisms.** "not just X, but Y", "not only X but also Y",
"It's not X, it's Y", "X rather than Y" as a pose, "One might think X.
Instead, Y."
Fix: say the thing. If Y beats X, show Y and skip X.

**Rule of three.** "fast, simple, and reliable"; three parallel clauses to
make a thin point look complete. Use the real number of items.

**Synonym cycling.** "the protagonist", then "the key player", then "the
central figure". Repeat the name. People do.

**Mechanical connectives.** Additionally, Moreover, Furthermore,
Consequently, "In today's fast-paced world", "When it comes to", "At its
core". The best transition is usually the next thought.

**Empty merisms / false ranges.** "from startups to enterprises", "from
concept to launch" with no scale between the poles. List what you mean.

**Dramatization.** game-changer, revolutionize, radically transform, "take
it to the next level", paradigm shift, "the future of X is here".
Fix: what actually changed.

**Didactic disclaimers.** "it's important to note", "worth noting", "it's
crucial to remember", "it should be noted that".
Fix: delete the wrapper, keep the content.

**Fake casualness.** "Honestly,", "Here's the thing:", "Let's be real",
"Spoiler:", "the secret sauce", "And here's the kicker:".
Voice comes from a precise thought, not inserted folksiness.

**Filler.** "In order to" → "To". "Due to the fact that" → "Because".
"It is important to note that" → (delete). "utilize"/"leverage" → "use".
"facilitate" → "help". "numerous" → "many". "in the event that" → "if".

## Style

**Colon as a mid-sentence crutch.** Fine before a list. Not: "If you're
coming from X: instead of Y, you Z." Let the point stand without the
comparison frame.

**Self-summary.** A paragraph whose last sentence explains what it meant;
"In summary", "Overall", "Ultimately, X is more than just Y". Delete.

**Excessive hedging.** "could potentially possibly be argued that it might"
→ "may". One hedge per real limitation, sitting on that claim.

**Adverbs propping up a weak verb.** "runs quickly" → the number, or "is
fast". "significantly improves" → the measured delta.

**Passive with a known actor.** "queries are validated" → "the compiler
validates queries". Passive is fine when the actor is unknown or does not
matter.

**Dense sentences.** If the reader backtracks, split. One idea per sentence
is a default, not a law: a long sentence that earns its length can sit next
to a two-word one.

## Communication artifacts

**Chatbot phrases.** "I hope this helps!", "Let me know if...", "Of course!",
"Certainly!", "Found the smoking gun!", "Would you like me to...", "In this
article, we will explore...".

**Sycophancy.** "Great question! You're absolutely right!" Answer.

**Cutoff disclaimers.** "While specific details are limited..." Find the
source or remove the claim.

**Markup debris.** See SKILL.md Level 1.

## Engineering jargon (metaphor, not our vocabulary)

These read as technical and usually aren't. Pick the concrete word.

| Drop                             | Prefer                                                |
| -------------------------------- | ----------------------------------------------------- |
| substrate                        | base, or the actual layer                             |
| wedge in                         | add                                                   |
| vector (as "way")                | way, method                                           |
| locus / vantage / nexus          | the place or relation you mean                        |
| harness (as metaphor)            | keep when this repo means the apps                    |
| gold-plating                     | more than the job needs                               |
| ratchet (metaphor)               | the mechanism's name, or "a limit that only tightens" |
| evacuate (for moving code)       | move out                                              |
| endgame                          | the last phase                                        |
| north star                       | the goal, named                                       |
| flywheel                         | the loop, named                                       |
| bedrock / scaffolding (metaphor) | the actual support                                    |
| modality / paradigm              | the thing itself                                      |

"API surface" in this repo is a real check (`check:public-api`), not this
table.

## Clean slop (second-order house style)

What text looks like after the other categories are cleaned: no GPT-isms,
every sentence load-bearing, every paragraph landing on an aphorism. Real
people don't sustain that.

Markers:

- Aphoristic one-liner closing paragraph after paragraph
- "That's not X. That's Y." (negative parallelism, upgraded)
- Clipped fragment pairs for drama: "Fused, one thing."
- Balanced antitheses replacing banned triads, three or more per text
- Hooks: "The real question is", "Here's what that means in practice",
  "The part that got me:"
- Verdict verbs on papers and events: "quietly kills", "demolishes"
- Uniform confidence: no sentence is unsure of itself
- Document template: hook, numbered evidence, turn ("So I built..."),
  qualifier, closing question. Catch with the outline test in SKILL.md

Fix: not another phrase. Unclench. Keep one punchy close. Let one or two
sentences be ordinary. Start one section in the middle of a thought.

Replacement tics: any substitute you reuse across three texts becomes a
marker. The cure for a cliché is usually its absence.
