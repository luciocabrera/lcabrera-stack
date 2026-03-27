import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  body: (height: number) => ({
    display: "grid",
    position: "relative",
    height,
  }),
});
