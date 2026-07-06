CREATE TYPE "public"."locale" AS ENUM('es', 'en');--> statement-breakpoint
CREATE TYPE "public"."reaction_kind" AS ENUM('thumbs_up', 'heart', 'fire');--> statement-breakpoint
CREATE TABLE "article_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"kind" "reaction_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_search" (
	"slug" text NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"body_text" text NOT NULL,
	"search_vector" "tsvector",
	CONSTRAINT "article_search_slug_locale_pk" PRIMARY KEY("slug","locale")
);
--> statement-breakpoint
CREATE TABLE "article_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(254) NOT NULL,
	"message" varchar(5000) NOT NULL,
	"locale" "locale" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"endpoint" text NOT NULL,
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limits_endpoint_key_window_start_pk" PRIMARY KEY("endpoint","key","window_start")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "article_reactions_slug_visitor_hash_kind_key" ON "article_reactions" USING btree ("slug","visitor_hash","kind");--> statement-breakpoint
CREATE INDEX "article_search_search_vector_idx" ON "article_search" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "article_views_slug_visitor_hash_key" ON "article_views" USING btree ("slug","visitor_hash");