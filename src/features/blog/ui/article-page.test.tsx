import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import type { GetArticleResult } from "../application/get-article";
import type { ArticleTeaser } from "../application/get-next-article";
import { ArticlePage } from "./article-page";

// `ArticlePage` composes `LocaleSwitcher`, which needs next-intl's
// locale-aware navigation hooks — same mock as
// `shared/i18n/ui/locale-switcher.test.tsx`.
vi.mock("next/navigation.js", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/blog/clean-architecture",
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const foundResult: GetArticleResult = {
  kind: "found",
  article: {
    slug: "clean-architecture",
    locale: "en",
    title: "Clean Architecture in Next.js",
    description: "desc",
    date: "2026-06-14",
    category: "architecture",
    tags: ["nextjs", "architecture"],
    readingTimeMinutes: 8,
    content: "## Section\n\nSome body text.",
  },
};

const fallbackResult: GetArticleResult = {
  kind: "fallback",
  requestedLocale: "en",
  contentLocale: "es",
  article: {
    ...foundResult.article,
    locale: "es",
  },
};

const nextArticle: ArticleTeaser = {
  slug: "design-patterns",
  locale: "en",
  title: "Design Patterns I Use Every Day",
  category: "patterns",
  readingTimeMinutes: 6,
};

async function renderPage(
  result: Exclude<GetArticleResult, { kind: "not-found" }>,
  next: ArticleTeaser | null = null,
  children: React.ReactNode = null,
) {
  const element = await ArticlePage({ result, nextArticle: next, children });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      {element}
    </NextIntlClientProvider>,
  );
}

describe("ArticlePage", () => {
  it("renders the header, cover, body, and tags for a directly-matched locale (blog: Article renders in requested locale)", async () => {
    await renderPage(foundResult);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Clean Architecture in Next.js",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Section" }),
    ).toBeInTheDocument();
    expect(screen.getByText("#nextjs")).toBeInTheDocument();
    expect(screen.getByText("Back to portfolio")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders the fallback notice when the article is served from the other locale (blog: Missing-Translation Fallback)", async () => {
    await renderPage(fallbackResult);

    expect(screen.getByRole("status")).toHaveTextContent(
      "This article is only available in Spanish.",
    );
  });

  it("renders the next-article card when a next article is available", async () => {
    await renderPage(foundResult, nextArticle);

    expect(screen.getByText("Next article")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Design Patterns I Use Every Day/ }),
    ).toBeInTheDocument();
  });

  it("omits the next-article card when there is none", async () => {
    await renderPage(foundResult, null);

    expect(screen.queryByText("Next article")).not.toBeInTheDocument();
  });

  it("renders children between the article body and the next-article card (composition-root slot for the engagement widget, task 7.5)", async () => {
    await renderPage(foundResult, nextArticle, <div data-testid="engagement-slot" />);

    expect(screen.getByTestId("engagement-slot")).toBeInTheDocument();
  });

  it("renders nothing extra when no children are passed", async () => {
    await renderPage(foundResult, null, null);

    expect(screen.queryByTestId("engagement-slot")).not.toBeInTheDocument();
  });
});
