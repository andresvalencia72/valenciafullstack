import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function importFresh() {
  vi.resetModules();
  return import("./env.public");
}

describe("publicEnv", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults NEXT_PUBLIC_SITE_URL to http://localhost:3000 when unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const { publicEnv } = await importFresh();

    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("uses the provided NEXT_PUBLIC_SITE_URL when set to a valid URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://valenciafullstack.tech";

    const { publicEnv } = await importFresh();

    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe(
      "https://valenciafullstack.tech",
    );
  });

  it("throws at import time when NEXT_PUBLIC_SITE_URL is not a valid URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";

    await expect(importFresh()).rejects.toThrow();
  });
});
