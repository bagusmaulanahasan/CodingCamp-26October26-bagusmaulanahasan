# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly web application that lets users record daily spending, review their transaction history, and visualize spending by category. The application provides a single-column mobile-first layout with a total balance summary, an input form, a scrollable transaction list, and a pie chart powered by Chart.js. Beyond the core features, the application supports custom categories, a monthly summary view, transaction sorting, a configurable spending limit with visual highlighting, and a dark/light theme toggle. The application is built with plain HTML, CSS, and Vanilla JavaScript, persists data in LocalStorage, and works across major desktop and mobile browsers.

## Glossary

- **Expense-Budget-Visualizer**: The web application described by this document.
- **Transaction**: A single spending record containing an Item Name, an Amount, and a Category, created at the moment the user submits the input form.
- **Item Name**: The textual label the user enters to describe a Transaction.
- **Amount**: The non-negative numeric monetary value the user enters for a Transaction.
- **Category**: A classification applied to a Transaction. Default Categories are Food, Transport, and Fun; Custom Categories are user-defined additions.
- **Total Balance**: The sum of the Amount values of every stored Transaction.
- **Pie Chart**: A Chart.js pie chart that visualizes total spending grouped by Category.
- **Monthly Summary**: A view that aggregates Transaction Amounts for a selected month, showing the total spend and per-Category totals for that month.
- **Spending Limit**: A user-defined monetary threshold used to detect and highlight overspending.
- **Theme**: The visual appearance mode of the application, either light mode or dark mode.
- **LocalStorage**: The browser's persistent key-value storage mechanism used to retain data between sessions.
- **CDN**: A content delivery network from which the Chart.js library is loaded via a script tag.

## Requirements

### Requirement 1: Transaction Entry

**User Story:** As a user, I want to add a spending transaction with an item name, amount, and category, so that I can record my daily spending.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL display an input form containing an Item Name field, an Amount field, and a Category field.
2. WHEN the user submits the input form with the Item Name, Amount, and Category fields filled, THE Expense-Budget-Visualizer SHALL create a new Transaction storing the entered Item Name, Amount, and Category.
3. IF the user submits the input form with one or more empty fields, THEN THE Expense-Budget-Visualizer SHALL display a validation message identifying the empty fields and SHALL NOT create a Transaction.
4. THE Expense-Budget-Visualizer SHALL initialize the Category field options to Food, Transport, and Fun.

### Requirement 2: Transaction List

**User Story:** As a user, I want to view and delete my recorded transactions, so that I can manage my spending history.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL display a list of all stored Transactions, with each list entry showing the Item Name, Amount, and Category of the Transaction.
2. WHEN the Transaction list contains more entries than the visible list area can display, THE Expense-Budget-Visualizer SHALL enable vertical scrolling within the list area.
3. WHEN the user activates the delete control on a Transaction, THE Expense-Budget-Visualizer SHALL remove that Transaction from storage and from the displayed list.

### Requirement 3: Total Balance

**User Story:** As a user, I want to see my total spending at the top of the screen, so that I can quickly understand my overall spending.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL display the Total Balance as the sum of every stored Transaction Amount at the top of the single-column layout.
2. WHEN a Transaction is added or deleted, THE Expense-Budget-Visualizer SHALL recalculate and update the displayed Total Balance immediately.

### Requirement 4: Spending Visualization

**User Story:** As a user, I want a visual chart of spending by category, so that I can understand my spending distribution at a glance.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL render a Pie Chart using the Chart.js library loaded from a CDN via a script tag.
2. THE Expense-Budget-Visualizer SHALL compute the Pie Chart data by aggregating stored Transaction Amounts grouped by Category.
3. WHEN a Transaction is added or deleted, THE Expense-Budget-Visualizer SHALL refresh the Pie Chart to reflect the updated category totals.

### Requirement 5: Custom Categories

**User Story:** As a user, I want to add custom categories beyond the defaults, so that I can track spending in categories relevant to me.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL allow the user to add a new Custom Category name to the Category field options.
2. WHEN the user adds a Custom Category, THE Expense-Budget-Visualizer SHALL persist the Custom Category, list the Custom Category in the Category field options, and include the Custom Category in the Pie Chart data.

### Requirement 6: Monthly Summary

**User Story:** As a user, I want a monthly summary of my spending, so that I can review totals for a selected month.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL associate each Transaction with the month in which the Transaction was created.
2. THE Expense-Budget-Visualizer SHALL display a Monthly Summary view that accepts a selected month from the user.
3. WHEN the user selects a month, THE Expense-Budget-Visualizer SHALL display the total spending and the per-Category spending totals for the selected month within the Monthly Summary view.

### Requirement 7: Transaction Sorting

**User Story:** As a user, I want to sort transactions by amount or category, so that I can find and compare spending entries.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL provide a sort control offering a sort-by-Amount option and a sort-by-Category option.
2. WHEN the user selects the sort-by-Amount option, THE Expense-Budget-Visualizer SHALL reorder the Transaction list by Amount value.
3. WHEN the user selects the sort-by-Category option, THE Expense-Budget-Visualizer SHALL reorder the Transaction list alphabetically by Category name.

### Requirement 8: Spending Limit Highlight

**User Story:** As a user, I want to set a spending limit and be alerted when I exceed it, so that I can control my budget.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL allow the user to set a Spending Limit amount.
2. WHILE the Total Balance exceeds the Spending Limit, THE Expense-Budget-Visualizer SHALL visually highlight the Total Balance to indicate the limit has been exceeded.
3. IF the Spending Limit is empty or set to zero, THEN THE Expense-Budget-Visualizer SHALL not apply the spending limit highlight.

### Requirement 9: Theme Toggle

**User Story:** As a user, I want to switch between dark and light mode, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL provide a control to toggle the Theme between light mode and dark mode.
2. WHEN the user toggles the Theme, THE Expense-Budget-Visualizer SHALL apply the selected Theme to the entire application interface immediately.
3. THE Expense-Budget-Visualizer SHALL persist the selected Theme across sessions using LocalStorage.

### Requirement 10: Data Persistence

**User Story:** As a user, I want my transactions and settings to persist between sessions, so that I do not lose my data when I close the app.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL store Transactions, Custom Categories, the Spending Limit, and the selected Theme in LocalStorage.
2. WHEN the application loads, THE Expense-Budget-Visualizer SHALL restore Transactions, Custom Categories, the Spending Limit, and the selected Theme from LocalStorage.
3. IF LocalStorage is unavailable, THEN THE Expense-Budget-Visualizer SHALL continue to operate using in-memory storage for the current session.

### Requirement 11: Responsive Layout and Application Structure

**User Story:** As a user, I want the app to work on my mobile device with a clean layout, so that I can track spending on the go.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL render a single-column layout that stacks the Total Balance, the input form, the Transaction list, and the Pie Chart vertically in that order.
2. WHILE the viewport width is 768 pixels or less, THE Expense-Budget-Visualizer SHALL display every section in the stacked single-column layout without horizontal scrolling.
3. THE Expense-Budget-Visualizer SHALL place all custom styling in a single CSS file located in the css/ directory and all custom logic in a single JavaScript file located in the js/ directory.
4. THE Expense-Budget-Visualizer SHALL load the Chart.js library from a CDN via a script tag and SHALL contain all remaining logic in the single JavaScript file in the js/ directory.

### Requirement 12: Cross-Browser Compatibility and Technology Constraints

**User Story:** As a user, I want the app to work across major browsers without external frameworks, so that I can use my preferred browser with a lightweight application.

#### Acceptance Criteria

1. THE Expense-Budget-Visualizer SHALL function correctly in Chrome, Firefox, Edge, and Safari browsers.
2. THE Expense-Budget-Visualizer SHALL be implemented using only HTML, CSS, and Vanilla JavaScript, without any application-level JavaScript frameworks.
