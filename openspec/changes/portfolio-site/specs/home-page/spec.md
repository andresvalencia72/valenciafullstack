# Home Page Specification

## Purpose

Single-page scroller composing all top-level sections of the portfolio: hero, stack strip, about, skills bento, projects, articles list, contact, footer.

## Requirements

### Requirement: Section Composition

The home page MUST render, in order, the sections: hero, stack strip, about, skills bento, projects (alternating cards), articles list, contact, footer.

#### Scenario: Full page render

- GIVEN a visitor requests `/` (or `/{locale}`)
- WHEN the page loads
- THEN all eight sections render in the specified order
- AND no section is omitted regardless of locale

### Requirement: In-Page Navigation

The home page MUST support smooth in-page navigation to each section via anchor links (e.g. nav menu).

#### Scenario: Anchor navigation

- GIVEN the visitor clicks a nav link for "Projects"
- WHEN the click is handled
- THEN the viewport scrolls smoothly to the projects section
- AND the URL hash updates to reflect the target section

### Requirement: Embedded Article List

The articles list section MUST display the latest articles inline on the home page, integrated with the `article-filter` capability. The system MUST NOT provide a separate `/blog` index route.

#### Scenario: Articles list renders inline

- GIVEN the home page has published articles
- WHEN the articles list section renders
- THEN articles MUST appear with title, category, and locale-appropriate excerpt
- AND clicking an article MUST navigate to `/blog/[slug]`

### Requirement: Responsive Layout

Every section MUST render correctly across mobile, tablet, and desktop breakpoints without horizontal overflow or broken layout.

#### Scenario: Mobile viewport

- GIVEN a viewport width of 375px
- WHEN the home page renders
- THEN all sections MUST stack vertically with no horizontal scroll
- AND interactive elements MUST remain tappable (min 44x44px touch target)
