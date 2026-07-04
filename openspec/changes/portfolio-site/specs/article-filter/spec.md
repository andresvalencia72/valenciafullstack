# Article Filter Specification

## Purpose

Functional category filter pills over the home page articles list.

## Requirements

### Requirement: Category Filtering

The system MUST filter the home page articles list by category when a filter pill is selected, without a full page reload. The set of filter pills MUST be the union of `category` values across published articles in the active locale, validated at build time against the i18n category catalog — the build MUST fail if any `category` id has no corresponding catalog label (per the `blog` capability's Frontmatter Validation requirement). A category with zero published articles in the active locale therefore has no pill.

#### Scenario: Filter by category

- GIVEN articles exist across multiple categories
- WHEN a visitor selects the pill for articles whose category is `frontend` (displayed via its localized label)
- THEN only articles whose category is `frontend` MUST remain visible
- AND the update MUST occur without navigating away from the home page

#### Scenario: Selecting a pill clears an active search query

- GIVEN a visitor has typed a search query that is currently active (per the `home-page` and `search` capabilities' search-input integration)
- WHEN they select a category pill
- THEN the search query MUST be cleared
- AND only articles matching the selected category MUST remain visible, drawn from the full published articles list

### Requirement: Reset Filter

The system MUST provide an "All" option that clears any active category filter and restores the full articles list.

#### Scenario: Clear filter

- GIVEN a category filter is active
- WHEN the visitor selects "All"
- THEN the articles list MUST display all articles again

### Requirement: Empty Result Handling

WHEN a search query (per the `home-page` and `search` capabilities' search-input integration) yields no matching articles, the system MUST display an empty-state message instead of an empty list. Because pills are derived from the union of categories actually present (see Category Filtering), a pill for a category with zero articles can never exist — so a "selected pill with no matches" case is unreachable. The reachable empty-result path is instead via the search input, which deactivates the active pill on input (per `home-page`: Embedded Article List — search input).

#### Scenario: Selecting a filter then searching to no matches shows empty state

- GIVEN a visitor has selected an active category pill (e.g. articles whose category is `frontend`)
- WHEN they then type a search query that matches no articles
- THEN the category pill selection MUST visually reset to none (search deactivates the active pill)
- AND the system MUST show a locale-appropriate empty-state message
- AND MUST NOT show a blank or broken list
