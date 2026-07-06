"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

interface YoutubeEmbedProps {
  /**
   * YouTube video id. Left undefined for now (design.md's PR4 scope:
   * "no real IDs yet, user provides later") — the placeholder still
   * renders, it just stays inert on click until a real id is set.
   */
  videoId?: string;
}

/**
 * Click-to-load YouTube embed placeholder (design-reference: video
 * section, `data-yt`). Renders a static placeholder box carrying
 * `data-video-id`; clicking it swaps in a real iframe embed once a
 * `videoId` is provided, matching the reference's click-to-play
 * behavior (no autoplaying iframe on initial render, avoids an
 * unnecessary YouTube network request per page view).
 */
export function YoutubeEmbed({ videoId }: YoutubeEmbedProps) {
  const t = useTranslations("blog.youtube");
  const [playing, setPlaying] = useState(false);

  if (playing && videoId) {
    return (
      <div className="relative my-7 aspect-video overflow-hidden rounded-xl">
        <iframe
          title={t("watching")}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      data-video-id={videoId ?? ""}
      aria-label={t("label")}
      onClick={() => setPlaying(true)}
      className="relative my-7 grid aspect-video w-full cursor-pointer place-items-center overflow-hidden rounded-xl bg-[#0f0f0f]"
    >
      <span className="grid h-13 w-18 place-items-center rounded-xl bg-coral">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" aria-hidden>
          <path d="m9 17 8-5-8-5z" />
        </svg>
      </span>
    </button>
  );
}
