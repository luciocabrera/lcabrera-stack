import * as stylex from '@stylexjs/stylex';
import { Suspense, use, useState } from 'react';

import type { TableColumn } from './components/Table/Table.types';

import { styles } from './App.stylex';
import { Button } from './components/Button';
import { Table } from './components/Table';

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value = Math.trunc(value);
    value = Math.trunc(value + 0x6d_2b_79_f5);
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const rng = mulberry32(123_456_789);

// Generate mock data for the table
const columnDefs: TableColumn[] = [...Array.from({ length: 20 }).keys()].map(
  (i) => ({
    dataType:
      i % 5 === 0
        ? 'number'
        : i % 5 === 1
          ? 'string'
          : i % 5 === 2
            ? 'boolean'
            : i % 5 === 3
              ? 'date'
              : 'currency',
    key: `col${i + 1}`,
    label: `Column ${i + 1}`,
  }),
);

function randomCurrency() {
  return (rng() * 10_000).toFixed(2);
}

function randomDate() {
  const start = new Date(2010, 0, 1).getTime();
  const end = new Date(2030, 0, 1).getTime();
  return new Date(start + rng() * (end - start));
}

function randomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from(
    {
      length,
    },
    () => chars[Math.floor(rng() * chars.length)],
  ).join('');
}

const tableData = [...Array.from({ length: 10_000 }).keys()].map((rowIdx) => {
  const row: Record<string, unknown> = {};
  for (const [colIdx, col] of columnDefs.entries()) {
    switch (col.dataType) {
      case 'boolean': {
        row[col.key] = rng() > 0.5;
        break;
      }
      case 'currency': {
        row[col.key] = `$${randomCurrency()}`;
        break;
      }
      case 'date': {
        row[col.key] = randomDate().toISOString().slice(0, 10);
        break;
      }
      case 'number': {
        row[col.key] = rowIdx * colIdx;
        break;
      }
      case 'string': {
        row[col.key] = randomString(8);
        break;
      }
      default: {
        row[col.key] = '';
      }
    }
  }
  return row;
});

/**
 * Simulated API delay in milliseconds
 * Adjust this value to test loading states
 */
const FAKE_API_DELAY_MS = 2000;

/**
 * Simulate fetching table data from an API
 */
const fetchTableData = (): Promise<Record<string, unknown>[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(tableData);
    }, FAKE_API_DELAY_MS);
  });

/**
 * Table section that loads data asynchronously
 * Uses React 19's use() hook for Suspense integration
 */
type AsyncTableSectionProps = {
  dataPromise: Promise<Record<string, unknown>[]>;
};

const AsyncTableSection = ({ dataPromise }: AsyncTableSectionProps) => {
  const data = use(dataPromise);

  return (
    <Table
      actions={
        <>
          <Button color='outline' size='sm'>
            Export
          </Button>
          <Button color='primary' size='sm'>
            Add Row
          </Button>
        </>
      }
      columns={columnDefs.map((col) => ({
        key: col.key,
        label: col.label,
        minWidth: 120,
      }))}
      data={data}
      icon={<span>📊</span>}
      isFlexWrapperEnabled={false}
      overscan={6}
      rowHeight={32}
      title='Data Table'
    />
  );
};

/**
 * Loading fallback for the table
 */
const TableLoadingFallback = () => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      height: '100%',
      justifyContent: 'center',
      width: '100%',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          animation: 'spin 1s linear infinite',
          border: '3px solid #e5e7eb',
          borderRadius: '50%',
          borderTopColor: '#3b82f6',
          height: 40,
          margin: '0 auto 16px',
          width: 40,
        }}
      />
      <p style={{ color: '#6b7280', margin: 0 }}>Loading table data...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/Card';
import {
  ErrorIcon,
  InfoIcon,
  MenuCloseIcon,
  MenuIcon,
  SettingsIcon,
  SuccessIcon,
  WarningIcon,
} from './components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from './components/SidePanel';
import {
  HorizontalToolbarExample,
  HorizontalToolbarExampleShort,
} from './components/Toolbar/Toolbar.examples';
import { useTheme } from './hooks/useTheme.hook';

// Create the promise once, outside the component to avoid refetching on re-renders
// In a real app, you'd use React Query, SWR, or similar
let tableDataPromise: Promise<Record<string, unknown>[]> | undefined;

const getTableDataPromise = () => {
  tableDataPromise ??= fetchTableData();
  return tableDataPromise;
};

const App = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [tableKey, setTableKey] = useState(0);

  // Function to reload the table data (for testing)
  const reloadTableData = () => {
    tableDataPromise = undefined; // Reset the promise
    setTableKey((prev) => prev + 1); // Force re-mount
  };

  return (
    <div {...stylex.props(styles.app)}>
      <div {...stylex.props(styles.container)}>
        <header {...stylex.props(styles.header)}>
          <h1 {...stylex.props(styles.title)}>Design System Showcase</h1>
          <Button color='ghost' onClick={toggleTheme}>
            {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </Button>
        </header>
        {/* Button Section */}
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Buttons</h2>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Colors</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button color='primary'>Primary</Button>
              <Button color='secondary'>Secondary</Button>
              <Button color='success'>Success</Button>
              <Button color='warning'>Warning</Button>
              <Button color='error'>Error</Button>
              <Button color='ghost'>Ghost</Button>
              <Button color='outline'>Outline</Button>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Sizes</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button size='sm'>Small</Button>
              <Button size='md'>Medium</Button>
              <Button size='lg'>Large</Button>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Variants</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button variant='solid'>Solid</Button>
              <Button variant='flat'>Flat</Button>
              <Button variant='elevated'>Elevated</Button>
            </div>
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>States</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button>Normal</Button>
              <Button isDisabled>Disabled</Button>
              <Button width='full'>Full Width</Button>
            </div>
          </div>
        </section>

        {/* Card Section */}
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Cards</h2>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Basic Cards</h3>
            <div {...stylex.props(styles.cardGrid)}>
              <Card elevation='sm'>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>
                    This is a simple card with header and body
                  </CardDescription>
                </CardHeader>
                <CardBody>
                  <p>
                    Card content goes here. You can add any content you want.
                  </p>
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
          </div>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Interactive Cards</h3>
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
          </div>

          {/* Table Showcase Section */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Table</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button color='secondary' onClick={reloadTableData}>
                🔄 Reload Table Data (Test Loading)
              </Button>
              <span style={{ alignSelf: 'center', color: '#6b7280', fontSize: 14 }}>
                Simulated delay: {FAKE_API_DELAY_MS}ms
              </span>
            </div>
            <div
              style={{
                borderRadius: 8,
                boxSizing: 'border-box',
                display: 'flex',
                height: '400px',
                maxWidth: '100%',
              }}
            >
              {/* Virtualized Table Component with Suspense */}
              <Suspense fallback={<TableLoadingFallback />} key={tableKey}>
                <AsyncTableSection dataPromise={getTableDataPromise()} />
              </Suspense>
            </div>
          </section>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Colored Cards</h3>
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
                  <CardDescription>
                    Perfect for success messages.
                  </CardDescription>
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
                  <CardDescription>
                    Display error messages here.
                  </CardDescription>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        {/* Side Panel Section */}
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Side Panels</h2>

          <div {...stylex.props(styles.subsection)}>
            <h3 {...stylex.props(styles.subsectionTitle)}>Positions & Sizes</h3>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button
                onClick={() => {
                  setIsLeftPanelOpen(true);
                }}
              >
                <MenuIcon
                  style={{
                    height: '1rem',
                    marginRight: '0.5rem',
                    width: '1rem',
                  }}
                />
                Open Left Panel
              </Button>
              <Button
                onClick={() => {
                  setIsRightPanelOpen(true);
                }}
              >
                Open Right Panel
                <MenuIcon
                  style={{
                    height: '1rem',
                    marginLeft: '0.5rem',
                    width: '1rem',
                  }}
                />
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Side Panels */}
      <SidePanel
        isOpen={isLeftPanelOpen}
        onClose={() => {
          setIsLeftPanelOpen(false);
        }}
        position='left'
        size='md'
      >
        <SidePanelHeader>
          <SidePanelTitle icon={<SettingsIcon />}>Settings</SidePanelTitle>
        </SidePanelHeader>
        <SidePanelBody>
          <p>This is a left-positioned side panel with medium size.</p>
          <p>
            It includes a header with an icon, a scrollable body, and a footer
            with actions.
          </p>
          <p>Press Escape or click the overlay to close.</p>
        </SidePanelBody>
        <SidePanelFooter>
          <Button
            onClick={() => {
              setIsLeftPanelOpen(false);
            }}
            size='sm'
            width='full'
          >
            <MenuCloseIcon
              style={{
                height: '1rem',
                marginRight: '0.5rem',
                width: '1rem',
              }}
            />
            Close
          </Button>
        </SidePanelFooter>
      </SidePanel>

      <SidePanel
        isOpen={isRightPanelOpen}
        onClose={() => {
          setIsRightPanelOpen(false);
        }}
        position='right'
        size='lg'
      >
        <SidePanelHeader>
          <SidePanelTitle icon={<InfoIcon />}>Information</SidePanelTitle>
        </SidePanelHeader>
        <SidePanelBody>
          <Card elevation='sm'>
            <CardBody>
              <CardTitle icon={<SuccessIcon />}>Composable Design</CardTitle>
              <CardDescription>
                Side panels work great with other components like cards!
              </CardDescription>
            </CardBody>
          </Card>
          <div
            style={{
              marginTop: '1rem',
            }}
          >
            <p>This right panel is larger (lg size).</p>
            <p>You can put any content here, including other components.</p>
          </div>

          <HorizontalToolbarExample />
          <HorizontalToolbarExampleShort />
        </SidePanelBody>
        <SidePanelFooter>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <Button
              color='ghost'
              onClick={() => {
                setIsRightPanelOpen(false);
              }}
              size='sm'
              width='full'
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsRightPanelOpen(false);
              }}
              size='sm'
              width='full'
            >
              Confirm
            </Button>
          </div>
        </SidePanelFooter>
      </SidePanel>
    </div>
  );
};

export default App;
