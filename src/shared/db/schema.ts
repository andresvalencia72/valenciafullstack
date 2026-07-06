import {
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema (declarative). Excluded from the coverage gate — see
 * `vitest.config.ts` (same basis as `shared/db/client.ts`: no branching
 * business logic to unit-test). Every change here MUST ship with a
 * generated migration under `drizzle/` (`npm run db:generate`), per
 * design.md Persistence > Migration workflow and the `persistence`
 * spec's "Versioned Schema and Migrations" requirement.
 */

/** Shared by `contact_messages` and `article_search`. */
export const localeEnum = pgEnum("locale", ["es", "en"]);

/** Fixed 3-value reaction catalog — see design.md Resolved Decisions. */
export const reactionKindEnum = pgEnum("reaction_kind", [
  "thumbs_up",
  "heart",
  "fire",
]);

/**
 * Postgres `tsvector` has no first-class Drizzle column builder; `customType`
 * maps it to the raw SQL type name. `search_vector` is a **plain column**,
 * not a `GENERATED ALWAYS AS (...) STORED` column — see the "search_vector:
 * plain column, not generated" note in tasks.md (task 5a.1 findings) for why
 * a generated column is not viable here (per-locale regconfig requires
 * `to_tsvector`, which Postgres classifies as STABLE, not IMMUTABLE — a hard
 * requirement for generated column expressions). `scripts/sync-search.ts`
 * (PR8) is the sole writer, via `UPDATE ... SET search_vector = to_tsvector(...)`.
 */
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  message: varchar("message", { length: 5000 }).notNull(),
  locale: localeEnum("locale").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /**
   * HMAC-SHA256(requester IP, keyed by `VISITOR_HASH_SECRET`) — never the
   * raw IP. Retained per contact message for abuse investigation (e.g.
   * correlating a spam wave back to one hashed origin across submissions)
   * even though `rate_limits` already enforces the request-time throttle;
   * this column supports after-the-fact review, not enforcement.
   */
  ipHash: varchar("ip_hash", { length: 64 }).notNull(),
});

export const articleViews = pgTable(
  "article_views",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Permanent dedupe (insert-if-absent via onConflictDoNothing) — no
    // rolling time window. See design.md Persistence.
    uniqueIndex("article_views_slug_visitor_hash_key").on(
      table.slug,
      table.visitorHash,
    ),
  ],
);

export const articleReactions = pgTable(
  "article_reactions",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    visitorHash: varchar("visitor_hash", { length: 64 }).notNull(),
    kind: reactionKindEnum("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // One reaction of each kind per (slug, visitor) — permanent dedupe.
    uniqueIndex("article_reactions_slug_visitor_hash_kind_key").on(
      table.slug,
      table.visitorHash,
      table.kind,
    ),
  ],
);

export const articleSearch = pgTable(
  "article_search",
  {
    slug: text("slug").notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    bodyText: text("body_text").notNull(),
    searchVector: tsvector("search_vector"),
  },
  (table) => [
    primaryKey({ columns: [table.slug, table.locale] }),
    // GIN index for `websearch_to_tsquery` + `ts_rank` queries (PR8).
    index("article_search_search_vector_idx").using("gin", table.searchVector),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    endpoint: text("endpoint").notNull(),
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [
    // Atomic upsert target: INSERT ... ON CONFLICT (endpoint, key,
    // window_start) DO UPDATE SET count = count + 1 RETURNING count.
    primaryKey({ columns: [table.endpoint, table.key, table.windowStart] }),
  ],
);
