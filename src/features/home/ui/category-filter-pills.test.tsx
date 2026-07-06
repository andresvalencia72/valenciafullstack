import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { CategoryFilterPills } from "./category-filter-pills";

function renderPills(
  categories: string[],
  active: string | null,
  onSelect = vi.fn(),
) {
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CategoryFilterPills
        categories={categories}
        active={active}
        onSelect={onSelect}
      />
    </NextIntlClientProvider>,
  );
  return onSelect;
}

describe("CategoryFilterPills", () => {
  it("renders an 'All' pill plus one pill per category present (article-filter: Category Filtering)", () => {
    renderPills(["architecture", "patterns"], null);

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Architecture" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Patterns" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Technologies" }),
    ).not.toBeInTheDocument();
  });

  it("marks the active pill via aria-pressed", () => {
    renderPills(["architecture", "patterns"], "architecture");

    expect(
      screen.getByRole("button", { name: "Architecture" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("marks 'All' as active when active is null", () => {
    renderPills(["architecture"], null);

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onSelect(null) when 'All' is clicked (article-filter: Reset Filter)", () => {
    const onSelect = renderPills(["architecture"], "architecture");

    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("calls onSelect(category) when a category pill is clicked (article-filter: Category Filtering)", () => {
    const onSelect = renderPills(["architecture"], null);

    fireEvent.click(screen.getByRole("button", { name: "Architecture" }));

    expect(onSelect).toHaveBeenCalledWith("architecture");
  });
});
