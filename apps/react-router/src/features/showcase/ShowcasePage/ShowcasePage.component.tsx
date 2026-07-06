import { Button } from '@repo/ui/components/Button';
import { useTheme } from '@repo/ui/hooks/useTheme.hook';
import * as stylex from '@stylexjs/stylex';

import { ButtonsSection } from './ButtonsSection';
import { CardsSection } from './CardsSection';
import { styles } from './ShowcasePage.stylex';
import { SidePanelSection } from './SidePanelSection';

// fallow-ignore-next-line complexity -- temporary showcase testing page
export const ShowcasePage = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div {...stylex.props(styles.app)}>
      <div {...stylex.props(styles.container)}>
        <header {...stylex.props(styles.header)}>
          <h1 {...stylex.props(styles.title)}>Design System Showcase</h1>
          <Button color='ghost' onClick={toggleTheme}>
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </Button>
        </header>
        <ButtonsSection />
        <CardsSection />
        <SidePanelSection />
      </div>
    </div>
  );
};
