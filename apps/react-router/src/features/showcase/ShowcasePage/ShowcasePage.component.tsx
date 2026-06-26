import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme.hook';

import { ButtonsSection } from './ButtonsSection';
import { CardsSection } from './CardsSection';
import { SidePanelSection } from './SidePanelSection';
import { styles } from './ShowcasePage.stylex';

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
