# Home Page Specification

## Purpose

Single-page scroller composing all top-level sections of the portfolio: hero, stack strip, about, skills bento, projects, articles list, github activity, contact, footer (nine sections total; github activity lands in the final implementation slice, PR10 — see Section Composition).

## Requirements

### Requirement: Section Composition

The home page MUST render, in order, the sections: hero, stack strip, about, skills bento, projects (alternating cards), articles list, github activity, contact, footer. The github activity section lands in the last implementation slice (PR10); the section-order end-to-end test is updated once PR10 ships.

#### Scenario: Full page render

- GIVEN a visitor requests `/` (or `/{locale}`)
- WHEN the page loads
- THEN all sections implemented to date render in the specified order
- AND no section is omitted regardless of locale
- AND the full nine-section set (including github activity) applies from the github-activity slice (PR10) onward

### Requirement: In-Page Navigation

The home page MUST support smooth in-page navigation to each section via anchor links (e.g. nav menu).

#### Scenario: Anchor navigation

- GIVEN the visitor clicks a nav link for "Projects"
- WHEN the click is handled
- THEN the viewport scrolls smoothly to the projects section
- AND the URL hash updates to reflect the target section

### Requirement: Embedded Article List

The articles list section MUST display the latest articles inline on the home page, integrated with the `article-filter` capability, and MUST include a search input — positioned above the category filter pills — that queries the `search` capability's endpoint and updates the visible results, rendered in place within the articles list (never a dropdown or separate panel), without a full page reload. Typing a non-empty search query MUST visually deactivate any active category pill (reset to no pill selected); clearing the query MUST restore the "All" pill state. Conversely, selecting a category pill while a search query is active MUST clear the query and apply the category filter over the full published articles list (not over the search results). The articles list for a given locale MUST include only articles that have an MDX file in that locale — consistent with the `seo` capability's RSS/sitemap exclusions and the `search` capability's locale filtering; articles missing a translation remain reachable via direct link or the locale switcher's fallback notice, but MUST NOT appear in the other locale's list. The system MUST NOT provide a separate `/blog` index route. The search input ships in PR8 (see `search` capability); prior to PR8, the articles list section renders with filter pills only, no search input.

#### Scenario: Articles list renders inline

- GIVEN the home page has published articles
- WHEN the articles list section renders
- THEN articles MUST appear with title, category, and locale-appropriate excerpt
- AND clicking an article MUST navigate to `/blog/[slug]`

#### Scenario: Article missing a locale is excluded from that locale's list

- GIVEN an article slug exists only in `es`
- WHEN the `en` articles list section renders
- THEN the list MUST NOT include an entry for that slug
- AND the article MUST remain reachable at `/en/blog/[slug]` via direct link or the locale switcher, rendering the missing-translation fallback notice

#### Scenario: Search input filters visible articles

- GIVEN the articles list section renders with a search input above the filter pills
- WHEN a visitor types a query matching an article's search-indexed content
- THEN the matching articles MUST appear in place within the articles list, without a full page reload
- AND any active category pill MUST visually reset to no selection
- AND the input MUST debounce keystrokes by at least 300ms before issuing a search request (search: Input Validation and Rate Limiting)

#### Scenario: Clearing the search query restores the filter view

- GIVEN a visitor has typed a search query that deactivated the category pills
- WHEN they clear the query
- THEN the pills MUST restore to the "All" selection
- AND the articles list MUST display all articles again

#### Scenario: Selecting a category pill during an active search

- GIVEN a visitor has typed a search query that is currently filtering the articles list
- WHEN they select a category pill
- THEN the search query MUST be cleared
- AND the articles list MUST show only articles matching the selected category, drawn from the full published list (not the prior search results)

#### Scenario: No articles exist

- GIVEN no articles have been published yet
- WHEN the articles list section renders
- THEN the system MUST display a locale-appropriate empty-state message
- AND MUST NOT show a blank or broken section

### Requirement: Responsive Layout

Every section MUST render correctly across mobile, tablet, and desktop breakpoints without horizontal overflow or broken layout.

#### Scenario: Mobile viewport

- GIVEN a viewport width of 375px
- WHEN the home page renders
- THEN all sections MUST stack vertically with no horizontal scroll
- AND interactive elements MUST remain tappable (min 44x44px touch target)
