import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { YoutubeEmbed } from "./youtube-embed";

function renderEmbed(videoId?: string) {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <YoutubeEmbed videoId={videoId} />
    </NextIntlClientProvider>,
  );
}

describe("YoutubeEmbed", () => {
  it("renders a clickable placeholder carrying data-video-id", () => {
    renderEmbed("dQw4w9WgXcQ");

    const trigger = screen.getByRole("button", { name: "Watch on YouTube" });
    expect(trigger).toHaveAttribute("data-video-id", "dQw4w9WgXcQ");
  });

  it("mounts an iframe embed for the given video id on click", () => {
    renderEmbed("dQw4w9WgXcQ");

    fireEvent.click(screen.getByRole("button", { name: "Watch on YouTube" }));

    const iframe = screen.getByTitle("Playing YouTube video");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
    );
  });

  it("renders an inert placeholder (no embed on click) when no videoId is provided yet", () => {
    renderEmbed(undefined);

    fireEvent.click(screen.getByRole("button", { name: "Watch on YouTube" }));

    expect(
      screen.queryByTitle("Playing YouTube video"),
    ).not.toBeInTheDocument();
  });
});
