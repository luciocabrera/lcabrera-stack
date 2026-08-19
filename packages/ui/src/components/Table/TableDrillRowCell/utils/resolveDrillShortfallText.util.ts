/**
 * How a drill row states the rows its page did not include — twice, because the
 * two audiences need different amounts of it.
 *
 * `plain` is what the cell shows: one line that has to survive a narrow column
 * at a fixed row height, so it says the number and nothing else. `linked` is the
 * accessible name of the hand-off, where there is no width to run out of and the
 * bare number would be a link announced as "214 more rows" with no statement of
 * where it goes.
 */
export const resolveDrillShortfallText = (shortfall: number) => {
  const rows = shortfall === 1 ? 'row' : 'rows';

  return {
    linked: `Show the remaining ${shortfall} ${rows} of this group, ungrouped`,
    plain: `${shortfall} more ${rows}`,
  };
};
