import { Button } from '@repo/ui/components/Button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/Card';
import {
  ErrorIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from '@repo/ui/components/Icons';
import * as stylex from '@stylexjs/stylex';

import { styles } from '../ShowcasePage.stylex';
import { ShowcaseSection } from '../ShowcaseSection';
import { ShowcaseSubsection } from '../ShowcaseSubsection';
import { TableSection } from '../TableSection';
import { VirtualSelectSection } from '../VirtualSelectSection';

export const CardsSection = () => (
  <ShowcaseSection title='Cards'>
    <ShowcaseSubsection title='Basic Cards'>
      <div {...stylex.props(styles.cardGrid)}>
        <Card elevation='sm'>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>
              This is a simple card with header and body
            </CardDescription>
          </CardHeader>
          <CardBody>
            <p>Card content goes here. You can add any content you want.</p>
          </CardBody>
        </Card>

        <Card elevation='md'>
          <CardHeader>
            <CardTitle>With Footer</CardTitle>
          </CardHeader>
          <CardBody>
            <p>This card includes a footer section.</p>
          </CardBody>
          <CardFooter>
            <Button size='sm' width='full'>
              Action
            </Button>
          </CardFooter>
        </Card>

        <Card elevation='lg' padding='lg'>
          <CardTitle>Custom Padding</CardTitle>
          <CardDescription>
            This card has custom padding applied.
          </CardDescription>
        </Card>
      </div>
    </ShowcaseSubsection>

    <ShowcaseSubsection title='Interactive Cards'>
      <div {...stylex.props(styles.cardGrid)}>
        <Card elevation='sm' interactive='hoverable'>
          <CardBody>
            <CardTitle>Hoverable Card</CardTitle>
            <CardDescription>
              Hover over this card to see the effect.
            </CardDescription>
          </CardBody>
        </Card>

        <Card
          elevation='sm'
          interactive='clickable'
          onClick={() => {
            alert('Card clicked!');
          }}
        >
          <CardBody>
            <CardTitle>Clickable Card</CardTitle>
            <CardDescription>
              Click this card to trigger an action.
            </CardDescription>
          </CardBody>
        </Card>
      </div>

      <VirtualSelectSection />
      <TableSection />

      <ShowcaseSubsection title='Colored Cards'>
        <div {...stylex.props(styles.cardGrid)}>
          <Card color='primary' elevation='sm'>
            <CardBody>
              <CardTitle icon={<InfoIcon />}>Primary Card</CardTitle>
              <CardDescription>
                This card uses the primary brand color.
              </CardDescription>
            </CardBody>
          </Card>

          <Card color='success' elevation='sm'>
            <CardBody>
              <CardTitle icon={<SuccessIcon />}>Success Card</CardTitle>
              <CardDescription>Perfect for success messages.</CardDescription>
            </CardBody>
          </Card>

          <Card color='warning' elevation='sm'>
            <CardBody>
              <CardTitle icon={<WarningIcon />}>Warning Card</CardTitle>
              <CardDescription>Use this for warnings.</CardDescription>
            </CardBody>
          </Card>

          <Card color='error' elevation='sm'>
            <CardBody>
              <CardTitle icon={<ErrorIcon />}>Error Card</CardTitle>
              <CardDescription>Display error messages here.</CardDescription>
            </CardBody>
          </Card>
        </div>
      </ShowcaseSubsection>
    </ShowcaseSubsection>
  </ShowcaseSection>
);
