# Implementation Plan: Kanban Drag-and-Drop Enhancements

## Overview

This plan implements two major capabilities for the Kanban task manager: (1) within-column card reordering via HTML5 drag-and-drop with a persisted `sort_order` column, and (2) a client-side filter bar with text search, priority, category, and due-date filters. The backend uses Express + better-sqlite3 (JavaScript) and the frontend uses React 19 + TypeScript + Vite. Implementation proceeds bottom-up: database schema first, then backend API, then frontend utilities, then UI components, with tests woven in alongside each layer.

## Tasks

- [ ] 1. Add sort_order column and migration logic to the database
  - [x] 1.1 Add sort_order column to the tasks table in `todo-app/backend/src/db.js`
    - Add `sort_order INTEGER NOT NULL DEFAULT 0` to the CREATE TABLE statement
    - Add migration logic: if the `sort_order` column does not exist on an existing database, ALTER TABLE to add it and backfill existing tasks with sequential sort_order values (1000, 2000, 3000…) grouped by status
    - _Requirements: 1.1_

  - [-] 1.2 Update `formatTask` in `todo-app/backend/src/routes.js` to include `sort_order` in API responses
    - Add `t.sort_order` to the TASK_SELECT query
    - Include `sort_order` in the `formatTask` return object
    - _Requirements: 1.3_

  - [-] 1.3 Update `GET /api/tasks` ordering to sort by `sort_order ASC, t.id ASC`
    - Replace the current `ORDER BY p.level DESC, t.due_date ASC` with `ORDER BY t.sort_order ASC, t.id ASC`
    - _Requirements: 1.3_

  - [-] 1.4 Update `POST /api/tasks` to assign sort_order at the bottom of the task's status column
    - Compute `sort_order = max(sort_order in column) + 1000`, or `1000` if the column is empty
    - _Requirements: 1.2_

  - [-] 1.5 Update `PUT /api/tasks/:id` to assign a new sort_order at the bottom of the target column when status changes
    - When the status field changes, compute a new sort_order for the target column
    - _Requirements: 2.5_

- [ ] 2. Implement the PATCH /api/tasks/reorder endpoint
  - [-] 2.1 Add `PATCH /api/tasks/reorder` route in `todo-app/backend/src/routes.js`
    - Accept `{ items: [{ id, sort_order }, ...] }` in the request body
    - Validate that items array is present and non-empty (return 400 if not)
    - Validate all task IDs exist before applying changes (return 404 if any missing)
    - Update all sort_order values in a single transaction
    - Return `{ message: "Reorder successful" }` on success
    - _Requirements: 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property tests for the reorder endpoint in `todo-app/backend/src/__tests__/reorder.test.js`
    - Set up vitest and fast-check as dev dependencies for the backend
    - **Property 3: Reorder endpoint round-trip** — For any valid array of `{ id, sort_order }` pairs, after calling reorder and fetching tasks, each task's sort_order equals the specified value
    - **Validates: Requirements 1.4**
    - **Property 4: Reorder transactional rollback on invalid ID** — For any payload containing a non-existent task ID, the endpoint returns 404 and no sort_order values are modified
    - **Validates: Requirements 1.6**

  - [ ]* 2.3 Write unit tests for the reorder endpoint edge cases
    - Test empty array returns 400 (Requirement 1.5)
    - Test sort_order column exists in schema (Requirement 1.1)
    - Test new task gets sort_order at bottom of column (Requirement 1.2)

- [ ] 3. Checkpoint - Verify backend changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Update frontend types and API client
  - [ ] 4.1 Add `sort_order` field to the `Task` interface in `todo-app/frontend/src/types.ts`
    - Add `sort_order: number` to the Task interface
    - _Requirements: 1.1_

  - [ ] 4.2 Add `reorderTasks` function to `todo-app/frontend/src/api.ts`
    - Add `reorderTasks(items: { id: number; sort_order: number }[])` calling `PATCH /api/tasks/reorder`
    - _Requirements: 1.4, 2.3_

- [ ] 5. Create reorder utility functions
  - [ ] 5.1 Create `todo-app/frontend/src/utils/reorderUtils.ts`
    - Implement `computeReorder(columnTasks, fromIndex, toIndex)` — returns new `{ id, sort_order }[]` for all tasks in the column after moving the task at fromIndex to toIndex, using gap-based sort_order values (multiples of 1000)
    - Implement `computeBottomSortOrder(columnTasks)` — returns a sort_order value greater than all existing tasks in the column
    - _Requirements: 2.1, 2.3, 2.5_

  - [ ]* 5.2 Write property tests for reorder utilities in `todo-app/frontend/src/utils/__tests__/reorderUtils.test.ts`
    - Set up vitest and fast-check as dev dependencies for the frontend
    - **Property 1: New task sort_order at bottom** — For any set of tasks, `computeBottomSortOrder` returns a value greater than all existing sort_orders
    - **Validates: Requirements 1.2**
    - **Property 5: Within-column reorder preserves set and applies permutation** — For any list of tasks and valid fromIndex/toIndex, `computeReorder` returns the same IDs, places the moved task at toIndex, and preserves relative order of other tasks
    - **Validates: Requirements 2.1, 2.3**

- [ ] 6. Create filter utility functions
  - [ ] 6.1 Create `todo-app/frontend/src/utils/filterUtils.ts`
    - Define `DueDateFilterValue` type: `"all" | "overdue" | "today" | "this-week" | "no-date"`
    - Define `FilterCriteria` interface with `searchQuery`, `priorityId`, `categoryId`, `dueDateFilter`
    - Implement `matchesSearch(task, query)` — case-insensitive substring match on title and description
    - Implement `matchesPriority(task, priorityId)` — matches priority ID or returns true when null
    - Implement `matchesCategory(task, categoryId)` — matches category ID or returns true when null
    - Implement `matchesDueDate(task, filter, today?)` — implements overdue/today/this-week/no-date/all logic
    - Implement `filterTasks(tasks, criteria)` — applies all predicates with logical AND
    - _Requirements: 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 5.2, 5.3, 5.4, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1_

  - [ ]* 6.2 Write property tests for filter utilities in `todo-app/frontend/src/utils/__tests__/filterUtils.test.ts`
    - **Property 8: Text search filter correctness** — For any task and non-empty query, `matchesSearch` returns true iff title or description contains the query as a case-insensitive substring
    - **Validates: Requirements 3.2**
    - **Property 9: Priority filter correctness** — For any task and priority ID, `matchesPriority` returns true iff task's priority ID equals the selected ID; null matches all
    - **Validates: Requirements 4.2**
    - **Property 10: Category filter correctness** — For any task and category ID, `matchesCategory` returns true iff task's category ID equals the selected ID; null matches all
    - **Validates: Requirements 5.2**
    - **Property 11: Due date filter correctness** — For any task and reference date, each due date filter option matches the correct subset of tasks
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
    - **Property 12: Combined filter AND composition** — For any tasks and filter combination, `filterTasks` returns exactly the tasks satisfying all active predicates
    - **Validates: Requirements 7.1**

- [ ] 7. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement the FilterBar component
  - [ ] 8.1 Create `todo-app/frontend/src/components/FilterBar.tsx`
    - Render a search input for text queries
    - Render a Priority dropdown populated with all priorities plus "All Priorities" default
    - Render a Category dropdown populated with all categories plus "All Categories" default
    - Render a Due Date dropdown with options: "All Dates", "Overdue", "Due Today", "Due This Week", "No Due Date"
    - Render a "Clear All" button visible when any filter is active
    - Accept props as defined in the design: `FilterBarProps`
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.2, 7.3_

  - [ ] 8.2 Add FilterBar styles to `todo-app/frontend/src/styles.css`
    - Style the filter bar container, search input, dropdowns, clear button, and active filter indicator
    - Ensure responsive layout on mobile (stack controls vertically)
    - _Requirements: 7.3_

- [ ] 9. Integrate drag-and-drop reordering into App.tsx
  - [ ] 9.1 Update `todo-app/frontend/src/App.tsx` to sort tasks by `sort_order` within columns
    - Modify `tasksByStatus` to sort by `sort_order ASC`, then `id ASC`
    - _Requirements: 1.3_

  - [ ] 9.2 Implement within-column drag-and-drop reorder logic in `todo-app/frontend/src/App.tsx`
    - Track the drop target index within a column using `onDragOver` with element position calculation
    - Distinguish within-column reorder from cross-column status change in the drop handler
    - On within-column drop: call `computeReorder`, update state optimistically, then call `reorderTasks` API
    - On API failure: revert to the pre-drag task state
    - On cross-column drop: preserve existing status change behavior and assign sort_order at bottom of target column
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [ ] 9.3 Add drop indicator visual during within-column drag
    - Render a visual drop indicator element between cards at the insertion point
    - Add CSS styles for the drop indicator in `todo-app/frontend/src/styles.css`
    - Apply reduced-opacity class to the dragged card
    - _Requirements: 2.2, 2.6_

- [ ] 10. Integrate FilterBar and filtering into App.tsx
  - [ ] 10.1 Add filter state and FilterBar to `todo-app/frontend/src/App.tsx`
    - Add state variables: `searchQuery`, `priorityFilter`, `categoryFilter`, `dueDateFilter`
    - Render `FilterBar` component between the header and the Kanban board
    - Wire up filter state change handlers
    - Compute `hasActiveFilters` flag for the FilterBar
    - Implement `onClearAll` to reset all filters to defaults
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.2, 7.3_

  - [ ] 10.2 Apply `filterTasks` to the task list before rendering columns
    - Pipe tasks through `filterTasks()` before grouping by status
    - Update column header counts to show filtered counts
    - Show empty state message when filters reduce a column to zero tasks ("No tasks match the current filters")
    - _Requirements: 3.2, 3.4, 4.2, 4.4, 5.2, 5.4, 6.2, 6.7, 7.1, 7.4, 3.5_

- [ ] 11. Checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 12. Write integration tests for drag-and-drop and filter UI behavior
  - [ ]* 12.1 Write unit tests for optimistic revert on API failure
    - **Property 6: Failed reorder reverts to previous state** — Mock API failure and verify UI state matches pre-drag state
    - **Validates: Requirements 2.4**
  - [ ]* 12.2 Write unit tests for cross-column drag bottom placement
    - **Property 7: Cross-column drag places task at bottom** — Verify task gets sort_order greater than all existing tasks in target column
    - **Validates: Requirements 2.5**
  - [ ]* 12.3 Write unit tests for FilterBar rendering and clear-all behavior
    - Test all filter controls render (Requirements 3.1, 4.1, 5.1, 6.1)
    - Test "Clear All" resets all filters (Requirement 7.2)
    - Test active filter visual indicator (Requirement 7.3)
    - Test empty column message when filtered to zero (Requirement 7.4)

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The backend uses JavaScript (ES modules); the frontend uses TypeScript
- No external drag-and-drop library is used — the implementation extends the existing HTML5 Drag and Drop API pattern
