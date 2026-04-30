# Requirements Document

## Introduction

This feature enhances the existing Kanban dashboard of the Task Manager application with two capabilities: (1) within-column card reordering via drag-and-drop with a persisted sort order, and (2) a search and filter bar that lets users find and narrow down tasks by text, priority, category, and due date. The existing cross-column drag-and-drop for status changes is preserved and extended to coexist with the new reordering behavior.

## Glossary

- **Kanban_Board**: The main three-column layout (To Do, In Progress, Completed) that displays task cards grouped by status.
- **Task_Card**: A draggable UI element representing a single task, displayed within a Kanban_Board column.
- **Sort_Order**: A numeric position value assigned to each task that determines its vertical display order within its status column. Lower values appear higher in the column.
- **Drop_Indicator**: A visual placeholder element shown between Task_Cards during a drag operation to indicate where the dragged card will be inserted.
- **Filter_Bar**: A UI component displayed above the Kanban_Board containing search and filter controls.
- **Search_Input**: A text field within the Filter_Bar that accepts free-text queries to match against task titles and descriptions.
- **Priority_Filter**: A dropdown control within the Filter_Bar that filters tasks by their priority level (High, Medium, Low).
- **Category_Filter**: A dropdown control within the Filter_Bar that filters tasks by their assigned category.
- **Due_Date_Filter**: A dropdown control within the Filter_Bar that filters tasks by due date ranges (Overdue, Due Today, Due This Week, No Due Date).
- **Backend_API**: The Express server that provides REST endpoints for task CRUD operations and persists data in SQLite via better-sqlite3.

## Requirements

### Requirement 1: Persist Sort Order in the Database

**User Story:** As a user, I want each task to have a stored sort position, so that my custom card arrangement survives page reloads and is consistent across sessions.

#### Acceptance Criteria

1. THE Backend_API SHALL store a Sort_Order integer column for every task in the tasks table.
2. WHEN a new task is created, THE Backend_API SHALL assign a Sort_Order value that places the task at the bottom of its status column.
3. WHEN the Backend_API returns a list of tasks, THE Backend_API SHALL order tasks within each status group by Sort_Order ascending, then by task id ascending as a tiebreaker.
4. THE Backend_API SHALL expose a PATCH endpoint at `/api/tasks/reorder` that accepts an array of `{ id, sort_order }` objects and updates each task's Sort_Order in a single transaction.
5. IF the `/api/tasks/reorder` endpoint receives an empty array, THEN THE Backend_API SHALL return a 400 status with a descriptive error message.
6. IF any task id in the reorder payload does not exist, THEN THE Backend_API SHALL return a 404 status with a descriptive error message and apply no changes.

### Requirement 2: Reorder Task Cards Within a Column

**User Story:** As a user, I want to drag a task card up or down within the same column to set a custom sort order, so that I can prioritize my work visually.

#### Acceptance Criteria

1. WHEN a user drags a Task_Card within the same status column, THE Kanban_Board SHALL reposition the card at the drop location and update the visual order immediately.
2. WHILE a Task_Card is being dragged within a column, THE Kanban_Board SHALL display a Drop_Indicator at the insertion point between existing cards.
3. WHEN a Task_Card is dropped at a new position within the same column, THE Kanban_Board SHALL send the updated Sort_Order values for all affected cards in that column to the Backend_API via the reorder endpoint.
4. IF the reorder API call fails, THEN THE Kanban_Board SHALL revert the card positions to their previous order.
5. WHEN a Task_Card is dragged to a different status column, THE Kanban_Board SHALL change the task's status and place the card at the bottom of the target column's sort order.
6. WHILE a Task_Card is being dragged, THE Task_Card SHALL display a reduced-opacity visual state to indicate it is the drag source.

### Requirement 3: Search Tasks by Title and Description

**User Story:** As a user, I want to type a search query to find tasks by title or description, so that I can quickly locate specific tasks on a busy board.

#### Acceptance Criteria

1. THE Filter_Bar SHALL display a Search_Input above the Kanban_Board.
2. WHEN a user types text into the Search_Input, THE Kanban_Board SHALL display only Task_Cards whose title or description contains the search text (case-insensitive match).
3. WHEN the Search_Input is cleared, THE Kanban_Board SHALL display all Task_Cards (subject to any active filters).
4. THE Search_Input SHALL filter tasks on the client side without making additional API calls.
5. WHILE a search query is active, THE Kanban_Board column headers SHALL display the filtered task count for each column.

### Requirement 4: Filter Tasks by Priority

**User Story:** As a user, I want to filter the board by priority level, so that I can focus on high-priority work.

#### Acceptance Criteria

1. THE Filter_Bar SHALL display a Priority_Filter dropdown populated with all available priority levels plus an "All Priorities" default option.
2. WHEN a user selects a priority from the Priority_Filter, THE Kanban_Board SHALL display only Task_Cards matching the selected priority.
3. WHEN the user selects "All Priorities", THE Kanban_Board SHALL remove the priority filter and display all tasks (subject to other active filters and search).
4. THE Priority_Filter SHALL operate on the client side without making additional API calls.

### Requirement 5: Filter Tasks by Category

**User Story:** As a user, I want to filter the board by category, so that I can view tasks related to a specific area.

#### Acceptance Criteria

1. THE Filter_Bar SHALL display a Category_Filter dropdown populated with all available categories plus an "All Categories" default option.
2. WHEN a user selects a category from the Category_Filter, THE Kanban_Board SHALL display only Task_Cards matching the selected category.
3. WHEN the user selects "All Categories", THE Kanban_Board SHALL remove the category filter and display all tasks (subject to other active filters and search).
4. THE Category_Filter SHALL operate on the client side without making additional API calls.

### Requirement 6: Filter Tasks by Due Date

**User Story:** As a user, I want to filter tasks by due date ranges, so that I can see what is overdue or coming up soon.

#### Acceptance Criteria

1. THE Filter_Bar SHALL display a Due_Date_Filter dropdown with the options: "All Dates", "Overdue", "Due Today", "Due This Week", and "No Due Date".
2. WHEN the user selects "Overdue", THE Kanban_Board SHALL display only non-completed Task_Cards whose due date is before today.
3. WHEN the user selects "Due Today", THE Kanban_Board SHALL display only Task_Cards whose due date equals today's date.
4. WHEN the user selects "Due This Week", THE Kanban_Board SHALL display only Task_Cards whose due date falls within the current calendar week (Monday through Sunday).
5. WHEN the user selects "No Due Date", THE Kanban_Board SHALL display only Task_Cards that have no due date assigned.
6. WHEN the user selects "All Dates", THE Kanban_Board SHALL remove the due date filter and display all tasks (subject to other active filters and search).
7. THE Due_Date_Filter SHALL operate on the client side without making additional API calls.

### Requirement 7: Combined Filter and Search Behavior

**User Story:** As a user, I want search and filters to work together, so that I can narrow down tasks using multiple criteria at once.

#### Acceptance Criteria

1. WHEN multiple filters and a search query are active simultaneously, THE Kanban_Board SHALL display only Task_Cards that satisfy all active criteria (logical AND).
2. THE Filter_Bar SHALL display a "Clear All" button that resets the Search_Input and all filter dropdowns to their default values.
3. WHILE any filter or search is active, THE Filter_Bar SHALL visually indicate that filtering is in effect.
4. WHEN filters reduce a column to zero visible tasks, THE Kanban_Board SHALL display an empty state message in that column indicating no tasks match the current filters.
