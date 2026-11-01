/**
 * The one spelling of a false-positive case id, `FP-` and four or more
 * digits, as the adjudication envelope's schema defines it. Every reader of a
 * case id, a case file name or a marker's claim takes its pattern from here.
 */
export const CASE_ID = /^FP-\d{4,}$/u;

export const CASE_FILE = /^FP-(\d{4,})(?:\.json)?$/u;

export const CLAIM = /^false positive, case (FP-\d{4,}):(.*)/u;
