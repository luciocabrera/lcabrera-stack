- first render:
- it shows the right filters, whihh are in the url (i guess are correctin the context?)
  - console logs:

  ```
  EnterpriseOrders.component.tsx:22 EnterpriseOrders rendered: {columnOrder: Array(0), columnSizing: {…}, columnVisibility: Set(0), filters: {…}, sorting: Array(0)}
  installHook.js:1 EnterpriseOrders rendered: {columnOrder: Array(0), columnSizing: {…}, columnVisibility: Set(0), filters: {…}, sorting: Array(0)}
  installHook.js:1 🎯 [TableProvider] initialColumnFilters: {priority: {…}, order_status: {…}, order_date: {…}, order_number: {…}, customer_email: {…}, …}
  overrideMethod @ installHook.js:1
  TableProvider @ TableContext.provider.tsx:88
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  <TableProvider>
  installHook.js:1 [FilterPopover] column: carrier, dataType: string, hasOptions: true, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: warehouse_location, dataType: string, hasOptions: true, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: warehouse_location, dataType: string, hasOptions: true, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: is_rush_order, dataType: boolean, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: is_rush_order, dataType: boolean, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: is_gift, dataType: boolean, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: is_gift, dataType: boolean, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: customer_rating, dataType: number, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: customer_rating, dataType: number, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: delivery_date, dataType: date, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: delivery_date, dataType: date, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: shipped_date, dataType: date, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 [FilterPopover] column: shipped_date, dataType: date, hasOptions: false, currentOperator: undefined, isListShowing: false
  overrideMethod @ installHook.js:1
  FilterPopover @ FilterPopover.component.tsx:162
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  EnterpriseOrders.component.tsx:22 EnterpriseOrders rendered: {columnOrder: Array(0), columnSizing: {…}, columnVisibility: Set(0), filters: {…}, sorting: Array(0)}
  installHook.js:1 EnterpriseOrders rendered: {columnOrder: Array(0), columnSizing: {…}, columnVisibility: Set(0), filters: {…}, sorting: Array(0)}
  installHook.js:1 🎯 [TableProvider] initialColumnFilters: {priority: {…}, order_status: {…}, order_date: {…}, order_number: {…}, customer_email: {…}, …}customer_email: {operator: 'contains', type: 'text', value: 'hotma'}customer_type: {operator: 'notContains', type: 'text', value: 'sin'}is_gift: {type: 'boolean', value: true}is_rush_order: {type: 'boolean', value: true}is_vip_customer: {type: 'boolean', value: false}order_date: {operator: 'after', type: 'date', value: '2010-01-01'}order_number: {operator: 'contains', type: 'text', value: '000'}order_status: {type: 'select', values: Array(2), operator: 'equals'}payment_status: {type: 'select', values: Array(2), operator: 'equals'}priority: {type: 'select', values: Array(1), operator: 'notEquals'}shipping_country: {type: 'select', values: Array(24), operator: 'equals'}subtotal: {operator: 'greaterThan', type: 'number', value: 10500}total_amount: {operator: 'greaterThanOrEqual', type: 'number', value: 10000}[[Prototype]]: Object
  overrideMethod @ installHook.js:1
  TableProvider @ TableContext.provider.tsx:88
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 🎯 [TableProvider] persistedState: {sorting: Array(0), columnFilters: {…}, columnOrder: Array(0), columnSizing: {…}, columnVisibility: Set(0)}columnFilters: customer_email: {operator: 'contains', type: 'text', value: 'hotma'}customer_type: {operator: 'notContains', type: 'text', value: 'sin'}is_gift: {type: 'boolean', value: true}is_rush_order: {type: 'boolean', value: true}is_vip_customer: {type: 'boolean', value: false}order_date: {operator: 'after', type: 'date', value: '2010-01-01'}order_number: {operator: 'contains', type: 'text', value: '000'}order_status: {type: 'select', values: Array(2), operator: 'equals'}payment_status: {type: 'select', values: Array(2), operator: 'equals'}priority: {type: 'select', values: Array(1), operator: 'notEquals'}shipping_country: {type: 'select', values: Array(24), operator: 'equals'}subtotal: {operator: 'greaterThan', type: 'number', value: 10500}total_amount: {operator: 'greaterThanOrEqual', type: 'number', value: 10000}[[Prototype]]: ObjectcolumnOrder: []columnSizing: {}columnVisibility: Set(0) {size: 0}sorting: [][[Prototype]]: Object
  overrideMethod @ installHook.js:1
  TableProvider @ TableContext.provider.tsx:89
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooks @ react-dom_client.js?v=2037a02a:4161
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 🎯 [TableProvider] initialColumnFilters: {priority: {…}, order_status: {…}, order_date: {…}, order_number: {…}, customer_email: {…}, …}
  overrideMethod @ installHook.js:1
  TableProvider @ TableContext.provider.tsx:88
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  installHook.js:1 🎯 [TableProvider] persistedState: {sorting: Array(0), columnFilters: {…}, columnOrder: Array(0), columnSizing: {…}, columnVisibility: Set(0)}
  overrideMethod @ installHook.js:1
  TableProvider @ TableContext.provider.tsx:89
  react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
  renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
  renderWithHooks @ react-dom_client.js?v=2037a02a:4167
  updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
  beginWork @ react-dom_client.js?v=2037a02a:5858
  runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
  performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
  workLoopConcurrentByScheduler @ react-dom_client.js?v=2037a02a:8186
  renderRootConcurrent @ react-dom_client.js?v=2037a02a:8169
  performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
  performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
  performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
  ```

```

- popover:
![alt text](image.png)

- change the filter but no apply, just close the popover in the close button in the corner
![alt text](image-1.png)

- open one more time the popover and is still showing the draft
![alt text](image-2.png)

- if i refresh the screen then shows it correctly, so again comming from the url/context

![alt text](image-3.png)


- see the console, it seems
```

installHook.js:1 [FilterPopover] column: customer*email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooks @ react-dom_client.js?v=2037a02a:4161
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
renderWithHooks @ react-dom_client.js?v=2037a02a:4167
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooks @ react-dom_client.js?v=2037a02a:4161
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
renderWithHooks @ react-dom_client.js?v=2037a02a:4167
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: endsWith, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooks @ react-dom_client.js?v=2037a02a:4161
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
flushSyncWork$1 @ react-dom_client.js?v=2037a02a:7897
batchedUpdates$1 @ react-dom_client.js?v=2037a02a:2131
dispatchEventForPluginEventSystem @ react-dom_client.js?v=2037a02a:8983
dispatchEvent @ react-dom_client.js?v=2037a02a:11101
dispatchDiscreteEvent @ react-dom_client.js?v=2037a02a:11083
handleMouseUp* @ unknown
installHook.js:1 [FilterPopover] column: customer*email, dataType: string, hasOptions: true, currentOperator: endsWith, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
renderWithHooks @ react-dom_client.js?v=2037a02a:4167
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
flushSyncWork$1 @ react-dom_client.js?v=2037a02a:7897
batchedUpdates$1 @ react-dom_client.js?v=2037a02a:2131
dispatchEventForPluginEventSystem @ react-dom_client.js?v=2037a02a:8983
dispatchEvent @ react-dom_client.js?v=2037a02a:11101
dispatchDiscreteEvent @ react-dom_client.js?v=2037a02a:11083
handleMouseUp* @ unknown
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooks @ react-dom_client.js?v=2037a02a:4161
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
renderWithHooks @ react-dom_client.js?v=2037a02a:4167
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooks @ react-dom_client.js?v=2037a02a:4161
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
renderWithHooks @ react-dom_client.js?v=2037a02a:4167
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooks @ react-dom_client.js?v=2037a02a:4161
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
renderWithHooks @ react-dom_client.js?v=2037a02a:4167
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performSyncWorkOnRoot @ react-dom_client.js?v=2037a02a:8829
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=2037a02a:8745
processRootScheduleInMicrotask @ react-dom_client.js?v=2037a02a:8766
(anonymous) @ react-dom_client.js?v=2037a02a:8840
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooks @ react-dom_client.js?v=2037a02a:4161
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36
installHook.js:1 [FilterPopover] column: customer_email, dataType: string, hasOptions: true, currentOperator: contains, isListShowing: false
overrideMethod @ installHook.js:1
FilterPopover @ FilterPopover.component.tsx:162
react_stack_bottom_frame @ react-dom_client.js?v=2037a02a:11660
renderWithHooksAgain @ react-dom_client.js?v=2037a02a:4212
renderWithHooks @ react-dom_client.js?v=2037a02a:4167
updateFunctionComponent @ react-dom_client.js?v=2037a02a:5321
beginWork @ react-dom_client.js?v=2037a02a:5858
runWithFiberInDEV @ react-dom_client.js?v=2037a02a:873
performUnitOfWork @ react-dom_client.js?v=2037a02a:8190
workLoopSync @ react-dom_client.js?v=2037a02a:8083
renderRootSync @ react-dom_client.js?v=2037a02a:8067
performWorkOnRoot @ react-dom_client.js?v=2037a02a:7737
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=2037a02a:8821
performWorkUntilDeadline @ react-dom_client.js?v=2037a02a:36

```

```
