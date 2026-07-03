# Article Filter Specification

## Purpose

Functional category filter pills over the home page articles list.

## Requirements

### Requirement: Category Filtering

The system MUST filter the home page articles list by category when a filter pill is selected, without a full page reload.

#### Scenario: Filter by category

- GIVEN articles exist across multiple categories
- WHEN a visitor selects the "Frontend" filter pill
- THEN only articles tagged "Frontend" MUST remain visible
- AND the update MUST occur without navigating away from the home page

### Requirement: Reset Filter

The system MUST provide an "All" option that clears any active category filter and restores the full articles list.

#### Scenario: Clear filter

- GIVEN a category filter is active
- WHEN the visitor selects "All"
- THEN the articles list MUST display all articles again

### Requirement: Empty Result Handling

WHEN a selected category has no matching articles, the system MUST display an empty-state message instead of an empty list.

#### Scenario: No matches

- GIVEN no articles exist for category "DevOps"
- WHEN the visitor selects the "DevOps" pill
- THEN the system MUST show a locale-appropriate empty-state message
- AND MUST NOT show a blank or broken list
