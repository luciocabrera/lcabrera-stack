import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { styles } from './App.stylex';
import { Button } from './components/Button/Button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/Card';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from './components/Icons';
import { darkTheme } from './design-system/themes/dark.stylex';
import { lightTheme } from './design-system/themes/light.stylex';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div {...stylex.props(styles.app, isDarkMode ? darkTheme : lightTheme)}>
      <div {...stylex.props(styles.container)}>
        <header {...stylex.props(styles.header)}>
          <h1 {...stylex.props(styles.title)}>Design System Showcase</h1>
          <Button color="ghost" onClick={handleToggleTheme}>
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </Button>
        </header>

        {/* Button Section */}
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Buttons</h2>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Colors</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button color="primary">Primary</Button>
              <Button color="secondary">Secondary</Button>
              <Button color="success">Success</Button>
              <Button color="warning">Warning</Button>
              <Button color="error">Error</Button>
              <Button color="ghost">Ghost</Button>
              <Button color="outline">Outline</Button>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Sizes</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Variants</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button variant="solid">Solid</Button>
              <Button variant="flat">Flat</Button>
              <Button variant="elevated">Elevated</Button>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>States</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button>Normal</Button>
              <Button isDisabled>Disabled</Button>
              <Button width="full">Full Width</Button>
            </div>
          </div>
        </section>

        {/* Card Section */}
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Cards</h2>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Basic Cards</h3>
            <div {...stylex.props(styles.cardGrid)}>
              <Card elevation="sm">
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>This is a simple card with header and body</CardDescription>
                </CardHeader>
                <CardBody>
                  <p>Card content goes here. You can add any content you want.</p>
                </CardBody>
              </Card>

              <Card elevation="md">
                <CardHeader>
                  <CardTitle>With Footer</CardTitle>
                </CardHeader>
                <CardBody>
                  <p>This card includes a footer section.</p>
                </CardBody>
                <CardFooter>
                  <Button size="sm" width="full">
                    Action
                  </Button>
                </CardFooter>
              </Card>

              <Card elevation="lg" padding="lg">
                <CardTitle>Custom Padding</CardTitle>
                <CardDescription>This card has custom padding applied.</CardDescription>
              </Card>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Interactive Cards</h3>
            <div {...stylex.props(styles.cardGrid)}>
              <Card elevation="sm" interactive="hoverable">
                <CardBody>
                  <CardTitle>Hoverable Card</CardTitle>
                  <CardDescription>Hover over this card to see the effect.</CardDescription>
                </CardBody>
              </Card>

              <Card
                elevation="sm"
                interactive="clickable"
                onClick={() => {
                  alert('Card clicked!');
                }}
              >
                <CardBody>
                  <CardTitle>Clickable Card</CardTitle>
                  <CardDescription>Click this card to trigger an action.</CardDescription>
                </CardBody>
              </Card>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Colored Cards</h3>
            <div {...stylex.props(styles.cardGrid)}>
              <Card color="primary" elevation="sm">
                <CardBody>
                  <CardTitle icon={<InfoIcon />}>Primary Card</CardTitle>
                  <CardDescription>This card uses the primary brand color.</CardDescription>
                </CardBody>
              </Card>

              <Card color="success" elevation="sm">
                <CardBody>
                  <CardTitle icon={<SuccessIcon />}>Success Card</CardTitle>
                  <CardDescription>Perfect for success messages.</CardDescription>
                </CardBody>
              </Card>

              <Card color="warning" elevation="sm">
                <CardBody>
                  <CardTitle icon={<WarningIcon />}>Warning Card</CardTitle>
                  <CardDescription>Use this for warnings.</CardDescription>
                </CardBody>
              </Card>

              <Card color="error" elevation="sm">
                <CardBody>
                  <CardTitle icon={<ErrorIcon />}>Error Card</CardTitle>
                  <CardDescription>Display error messages here.</CardDescription>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
