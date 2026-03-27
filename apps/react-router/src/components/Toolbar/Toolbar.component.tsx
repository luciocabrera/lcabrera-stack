import * as stylex from "@stylexjs/stylex";

import { Button } from "@/components/Button";
import { NavLink } from "@/components/NavLink";

import type { ToolbarProps } from "./Toolbar.types.ts";

import { styles } from "./Toolbar.stylex.ts";

export const Toolbar = ({
  items,
  orientation = "vertical",
  size = "md",
  ...props
}: ToolbarProps) => {
  return (
    <nav
      role="navigation"
      {...props}
      {...stylex.props(
        styles.toolbar,
        orientation === "horizontal" ? styles.toolbarHorizontal : styles.toolbarVertical,
      )}
    >
      <ul
        {...stylex.props(
          styles.toolbar,
          orientation === "horizontal" ? styles.toolbarHorizontal : styles.toolbarVertical,
        )}
      >
        {items.map((item) => {
          const itemKey = `toolbar-item-${item.label}`;

          return (
            <li
              key={itemKey}
              {...stylex.props(
                styles.toolbarItem,
                orientation === "horizontal" && styles.toolbarItemResponsive,
              )}
            >
              {item.type === "button" ? (
                <Button
                  color={item.color}
                  icon={item.icon}
                  isDisabled={item.isDisabled}
                  onClick={item.onClick}
                  orientation={orientation}
                  size={item.size ?? size}
                  type={item.type}
                  width="full"
                >
                  {item.label}
                </Button>
              ) : (
                <NavLink
                  color={item.color}
                  end={item.end}
                  icon={item.icon}
                  orientation={orientation}
                  size={item.size ?? size}
                  to={item.to}
                  width="full"
                >
                  {item.label}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
