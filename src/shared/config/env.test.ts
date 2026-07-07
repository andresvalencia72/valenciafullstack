import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetEnvCacheForTests, getEnv } from "./env";

const REQUIRED_ENV = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/db",
  VISITOR_HASH_SECRET: "test-secret",
};

describe("getEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    __resetEnvCacheForTests();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    __resetEnvCacheForTests();
  });

  it("throws when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;

    expect(() => getEnv()).toThrowError(/DATABASE_URL/);
  });

  it("throws when VISITOR_HASH_SECRET is missing", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    delete process.env.VISITOR_HASH_SECRET;

    expect(() => getEnv()).toThrowError(/VISITOR_HASH_SECRET/);
  });

  it("succeeds with only the required variables set", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.GITHUB_TOKEN;

    const env = getEnv();

    expect(env.DATABASE_URL).toBe(REQUIRED_ENV.DATABASE_URL);
    expect(env.VISITOR_HASH_SECRET).toBe(REQUIRED_ENV.VISITOR_HASH_SECRET);
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.GITHUB_TOKEN).toBeUndefined();
  });

  it("defaults EMAIL_DRIVER to 'resend' when unset", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;
    delete process.env.EMAIL_DRIVER;

    expect(getEnv().EMAIL_DRIVER).toBe("resend");
  });

  it("accepts EMAIL_DRIVER='fake'", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;
    process.env.EMAIL_DRIVER = "fake";

    expect(getEnv().EMAIL_DRIVER).toBe("fake");
  });

  it("rejects an invalid EMAIL_DRIVER value", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;
    process.env.EMAIL_DRIVER = "sendgrid";

    expect(() => getEnv()).toThrowError();
  });

  it("defaults CONTACT_EMAIL_FROM to the Resend sandbox sender when unset", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;
    delete process.env.CONTACT_EMAIL_FROM;

    expect(getEnv().CONTACT_EMAIL_FROM).toBe(
      "Portfolio Contact <onboarding@resend.dev>",
    );
  });

  it("leaves CONTACT_EMAIL_TO undefined when unset (triangulation — optional, no default)", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;
    delete process.env.CONTACT_EMAIL_TO;

    expect(getEnv().CONTACT_EMAIL_TO).toBeUndefined();
  });

  it("caches the parsed result across calls", () => {
    process.env.DATABASE_URL = REQUIRED_ENV.DATABASE_URL;
    process.env.VISITOR_HASH_SECRET = REQUIRED_ENV.VISITOR_HASH_SECRET;

    const first = getEnv();
    process.env.DATABASE_URL = "postgres://changed-after-first-call";
    const second = getEnv();

    expect(second).toBe(first);
    expect(second.DATABASE_URL).toBe(REQUIRED_ENV.DATABASE_URL);
  });
});
