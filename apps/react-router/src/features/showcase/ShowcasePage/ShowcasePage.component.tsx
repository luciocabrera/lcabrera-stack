import * as stylex from '@stylexjs/stylex';
import { useCallback, useRef, useState } from 'react';

import type { TableColumn } from '@/components/Table/Table.types';
import type { VirtualListDataState } from '@/components/VirtualList';

import { Button } from '@/components/Button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/Card';
import {
  ErrorIcon,
  InfoIcon,
  MenuCloseIcon,
  MenuIcon,
  SettingsIcon,
  SuccessIcon,
  WarningIcon,
} from '@/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from '@/components/SidePanel';
import { TableLayout } from '@/components/Table/TableLayout';
import {
  HorizontalToolbarExample,
  HorizontalToolbarExampleShort,
} from '@/components/Toolbar/Toolbar.examples';
import { VirtualSelect } from '@/components/VirtualSelect';
import { useTheme } from '@/hooks/useTheme.hook';

import type {
  MockResponse,
  MockRow,
  ShowcaseSectionProps,
  ShowcaseSubsectionProps,
} from './ShowcasePage.types';

import { styles } from './ShowcasePage.stylex';

const mulberry32 = (seed: number) => {
  let value = seed;
  return () => {
    value = Math.trunc(value);
    // oxlint-disable-next-line unicorn/number-literal-case -- formatter lowercases hex digits
    value = Math.trunc(value + 0x6d_2b_79_f5);
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.trunc(t ^ (t >>> 14)) / 4_294_967_296;
  };
};

const rng = mulberry32(123_456_789);

// Generate mock data for the table
const COLUMNS: TableColumn<MockRow>[] = [
  ...Array.from({ length: 20 }).keys(),
].map((i) => ({
  dataType: (['number', 'string', 'boolean', 'date', 'currency'] as const)[
    i % 5
  ],
  key: `col${i + 1}`,
  label: `Column ${i + 1}`,
  minWidth: 120,
}));

const randomCurrency = () => {
  return (rng() * 10_000).toFixed(2);
};

const randomDate = () => {
  const start = new Date(2010, 0, 1).getTime();
  const end = new Date(2030, 0, 1).getTime();
  return new Date(start + rng() * (end - start));
};

const randomString = (length: number) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from(
    {
      length,
    },
    () => chars[Math.floor(rng() * chars.length)],
  ).join('');
};

const tableData: MockRow[] = [...Array.from({ length: 10_000 }).keys()].map(
  // fallow-ignore-next-line complexity -- temporary showcase-only data generator
  (rowIdx) => {
    const row: MockRow = {};
    for (const [colIdx, col] of COLUMNS.entries()) {
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
  },
);

/**
 * Simulated API delay in milliseconds
 * Adjust this value to test loading states
 */
const FAKE_API_DELAY_MS = 2000;

const PERSISTENCE_KEY = 'app-showcase-table';

// --- VirtualSelect showcase data ---
const STATIC_FRUITS = [
  'Apple',
  'Banana',
  'Cherry',
  'Date',
  'Elderberry',
  'Fig',
  'Grape',
  'Honeydew',
  'Kiwi',
  'Lemon',
  'Mango',
  'Nectarine',
  'Orange',
  'Papaya',
  'Quince',
  'Raspberry',
  'Strawberry',
  'Tangerine',
  'Watermelon',
];

// Large dataset for fetch simulation (5000 cities)
const LARGE_DATASET = [...Array.from({ length: 5000 }).keys()].map(
  (i) => `City_${String(i + 1).padStart(5, '0')}`,
);
const FETCH_PAGE_SIZE = 50;
const FETCH_DELAY_MS = 800;

/**
 * Simulate fetching table data from an API
 */
const fetchTableData = (): Promise<MockResponse> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: tableData, total: tableData.length });
    }, FAKE_API_DELAY_MS);
  });

// Create the promise once, outside the component to avoid refetching on re-renders
// In a real app, you'd use React Query, SWR, or similar
const tableDataPromiseCache: {
  current: Promise<MockResponse> | undefined;
} = {
  current: undefined,
};

const getTableDataPromise = () => {
  tableDataPromiseCache.current ??= fetchTableData();
  return tableDataPromiseCache.current;
};

const resetTableDataPromise = (): void => {
  tableDataPromiseCache.current = undefined;
};

const ShowcaseSection = ({ children, title }: ShowcaseSectionProps) => {
  return (
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.sectionTitle)}>{title}</h2>
      {children}
    </section>
  );
};

const ShowcaseSubsection = ({ children, title }: ShowcaseSubsectionProps) => {
  return (
    <div {...stylex.props(styles.subsection)}>
      <h3 {...stylex.props(styles.subsectionTitle)}>{title}</h3>
      {children}
    </div>
  );
};

// fallow-ignore-next-line complexity -- temporary showcase testing page
export const ShowcasePage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // --- VirtualSelect showcase state ---
  const [singleSelected, setSingleSelected] = useState<string[]>([]);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [alwaysOpenSelected, setAlwaysOpenSelected] = useState<string[]>([]);
  const [fetchSelected, setFetchSelected] = useState<string[]>([]);
  const [fetchDataState, setFetchDataState] = useState<VirtualListDataState>({
    data: [],
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    totalCount: LARGE_DATASET.length,
  });

  const fetchedCountRef = useRef(0);

  const handleFetchInitial = useCallback(() => {
    setFetchDataState({
      data: [],
      hasMore: true,
      isLoading: true,
      isLoadingMore: false,
      totalCount: LARGE_DATASET.length,
    });
    fetchedCountRef.current = 0;

    setTimeout(() => {
      const page = LARGE_DATASET.slice(0, FETCH_PAGE_SIZE);
      fetchedCountRef.current = FETCH_PAGE_SIZE;
      setFetchDataState({
        data: page,
        hasMore: FETCH_PAGE_SIZE < LARGE_DATASET.length,
        isLoading: false,
        isLoadingMore: false,
        totalCount: LARGE_DATASET.length,
      });
    }, FETCH_DELAY_MS);
  }, []);

  const handleFetchMore = useCallback(() => {
    setFetchDataState((prev) => ({ ...prev, isLoadingMore: true }));

    setTimeout(() => {
      const nextCount = fetchedCountRef.current + FETCH_PAGE_SIZE;
      const nextPage = LARGE_DATASET.slice(0, nextCount);
      fetchedCountRef.current = nextCount;
      setFetchDataState({
        data: nextPage,
        hasMore: nextCount < LARGE_DATASET.length,
        isLoading: false,
        isLoadingMore: false,
        totalCount: LARGE_DATASET.length,
      });
    }, FETCH_DELAY_MS);
  }, []);

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
        <ShowcaseSection title='Buttons'>
          <ShowcaseSubsection title='Colors'>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button color='primary'>Primary</Button>
              <Button color='secondary'>Secondary</Button>
              <Button color='success'>Success</Button>
              <Button color='warning'>Warning</Button>
              <Button color='error'>Error</Button>
              <Button color='ghost'>Ghost</Button>
              <Button color='outline'>Outline</Button>
            </div>
          </ShowcaseSubsection>

          <ShowcaseSubsection title='Sizes'>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button size='sm'>Small</Button>
              <Button size='md'>Medium</Button>
              <Button size='lg'>Large</Button>
            </div>
          </ShowcaseSubsection>

          <ShowcaseSubsection title='Variants'>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button variant='solid'>Solid</Button>
              <Button variant='flat'>Flat</Button>
              <Button variant='elevated'>Elevated</Button>
            </div>
          </ShowcaseSubsection>

          <ShowcaseSubsection title='States'>
            <div {...stylex.props(styles.buttonGrid)}>
              <Button>Normal</Button>
              <Button isDisabled>Disabled</Button>
              <Button width='full'>Full Width</Button>
            </div>
          </ShowcaseSubsection>
        </ShowcaseSection>

        {/* Card Section */}
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
          </ShowcaseSubsection>

          {/* Table Showcase Section */}
          <ShowcaseSection title='VirtualSelect'>
            <ShowcaseSubsection title='Single Select (static options)'>
              <div style={{ maxWidth: '20rem' }}>
                <VirtualSelect
                  mode='single'
                  onChange={setSingleSelected}
                  options={STATIC_FRUITS}
                  placeholder='Pick a fruit...'
                  selected={singleSelected}
                />
              </div>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
                Selected:{' '}
                {singleSelected.length > 0
                  ? singleSelected.join(', ')
                  : '(none)'}
              </p>
            </ShowcaseSubsection>

            <ShowcaseSubsection title='Multi Select (static options)'>
              <div style={{ maxWidth: '20rem' }}>
                <VirtualSelect
                  mode='multi'
                  onChange={setMultiSelected}
                  options={STATIC_FRUITS}
                  placeholder='Pick fruits...'
                  selected={multiSelected}
                />
              </div>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
                Selected:{' '}
                {multiSelected.length > 0 ? multiSelected.join(', ') : '(none)'}
              </p>
            </ShowcaseSubsection>

            <ShowcaseSubsection
              title={`Fetch Mode (5,000 items, paginated ${FETCH_PAGE_SIZE} at a time)`}
            >
              <div style={{ maxWidth: '20rem' }}>
                <VirtualSelect
                  dataState={fetchDataState}
                  mode='multi'
                  onChange={setFetchSelected}
                  onFetchInitial={handleFetchInitial}
                  onFetchMore={handleFetchMore}
                  placeholder='Search cities...'
                  selected={fetchSelected}
                  shouldShowLoadedCount
                />
              </div>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                Selected:{' '}
                {fetchSelected.length > 0 ? fetchSelected.join(', ') : '(none)'}
              </p>
            </ShowcaseSubsection>

            <ShowcaseSubsection title='Always Open (isAlwaysOpen)'>
              <div style={{ maxWidth: '20rem' }}>
                <VirtualSelect
                  isAlwaysOpen
                  mode='multi'
                  onChange={setAlwaysOpenSelected}
                  options={STATIC_FRUITS}
                  placeholder='Pick fruits...'
                  selected={alwaysOpenSelected}
                />
              </div>
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
                Selected:{' '}
                {alwaysOpenSelected.length > 0
                  ? alwaysOpenSelected.join(', ')
                  : '(none)'}
              </p>
            </ShowcaseSubsection>
          </ShowcaseSection>

          {/* Table Showcase Section */}
          <ShowcaseSection title='Table'>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button color='secondary' onClick={resetTableDataPromise}>
                🔄 Reload Table Data (Test Loading)
              </Button>
              <span
                style={{ alignSelf: 'center', color: '#6b7280', fontSize: 14 }}
              >
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
              <TableLayout<MockRow, MockResponse>
                columns={COLUMNS}
                dataPromise={getTableDataPromise()}
                dataSelector={(response) => response.data}
                dataTotalSelector={(response) => response.total}
                persistenceKey={PERSISTENCE_KEY}
                title='Data Table'
              />
            </div>
          </ShowcaseSection>

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
          </ShowcaseSubsection>
        </ShowcaseSection>

        {/* Side Panel Section */}
        <ShowcaseSection title='Side Panels'>
          <ShowcaseSubsection title='Positions & Sizes'>
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
          </ShowcaseSubsection>
        </ShowcaseSection>
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
