import { describe, expect, it } from "vitest";
import { mapSubmitContactResultToResponse } from "./map-submit-contact-result";

describe("mapSubmitContactResultToResponse", () => {
  it("maps 'sent' to HTTP 200 with a success body (contact: Valid submission)", () => {
    expect(mapSubmitContactResultToResponse({ kind: "sent" })).toEqual({
      status: 200,
      body: { status: "sent" },
    });
  });

  it("maps 'honeypot' to a response byte-identical to 'sent' (contact: Spam Mitigation)", () => {
    expect(mapSubmitContactResultToResponse({ kind: "honeypot" })).toEqual(
      mapSubmitContactResultToResponse({ kind: "sent" }),
    );
  });

  it("maps 'delayed' to HTTP 202 without leaking internal details (contact: Email service failure)", () => {
    const response = mapSubmitContactResultToResponse({ kind: "delayed" });

    expect(response.status).toBe(202);
    expect(response.body).not.toHaveProperty("error");
    expect(response.body).not.toHaveProperty("stack");
  });

  it("maps 'invalid' to HTTP 400", () => {
    expect(mapSubmitContactResultToResponse({ kind: "invalid" }).status).toBe(
      400,
    );
  });

  it("maps 'rate-limited' to HTTP 429", () => {
    expect(
      mapSubmitContactResultToResponse({ kind: "rate-limited" }).status,
    ).toBe(429);
  });

  it("maps 'persistence-failed' to HTTP 503 with a generic-only body (contact: Persistence failure, security: No PII Leakage)", () => {
    const response = mapSubmitContactResultToResponse({
      kind: "persistence-failed",
    });

    expect(response.status).toBe(503);
    expect(response.body).not.toHaveProperty("error");
    expect(response.body).not.toHaveProperty("stack");
  });
});
