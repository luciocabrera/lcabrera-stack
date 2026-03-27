import * as stylex from "@stylexjs/stylex";

import { spacing } from "@/design-system/tokens/base.stylex";

export const styles = stylex.create({
  toolbar: {
    margin: 0,
    padding: 0,
    gap: spacing.xs,
    listStyle: "none",
    containerName: "toolbar",
    containerType: "inline-size",
    display: "flex",
    width: "100%",
  },

  toolbarHorizontal: {
    flexDirection: {
      default: "row",
      "@container toolbar (max-width: 400px)": "column",
    },
    flexWrap: "wrap",
  },

  toolbarVertical: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },

  toolbarItem: {
    flex: "0 0 auto",
    display: "flex",
  },

  toolbarItemResponsive: {
    flex: {
      default: "0 0 auto",
      "@container toolbar (max-width: 400px)": "1 1 100%",
    },
  },
});
