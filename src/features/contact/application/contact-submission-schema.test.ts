import { describe, expect, it } from "vitest";
import {
  contactSubmissionSchema,
  isHoneypotTriggered,
} from "./contact-submission-schema";

const VALID_SUBMISSION = {
  name: "Andrés Valencia",
  email: "andres@example.com",
  message: "Hello from the contact form",
  locale: "es",
};

describe("contactSubmissionSchema", () => {
  it("accepts a valid submission (contact: Server-Side Input Validation)", () => {
    const result = contactSubmissionSchema.safeParse(VALID_SUBMISSION);

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email format (triangulation)", () => {
    const result = contactSubmissionSchema.safeParse({
      ...VALID_SUBMISSION,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 100 characters", () => {
    const result = contactSubmissionSchema.safeParse({
      ...VALID_SUBMISSION,
      name: "a".repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an email longer than 254 characters", () => {
    const longLocalPart = "a".repeat(250);
    const result = contactSubmissionSchema.safeParse({
      ...VALID_SUBMISSION,
      email: `${longLocalPart}@example.com`,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a message longer than 5000 characters", () => {
    const result = contactSubmissionSchema.safeParse({
      ...VALID_SUBMISSION,
      message: "a".repeat(5001),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = contactSubmissionSchema.safeParse({
      ...VALID_SUBMISSION,
      message: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a locale outside the es/en enum", () => {
    const result = contactSubmissionSchema.safeParse({
      ...VALID_SUBMISSION,
      locale: "fr",
    });

    expect(result.success).toBe(false);
  });
});

describe("isHoneypotTriggered", () => {
  it("is false when the honeypot field is absent", () => {
    expect(isHoneypotTriggered(VALID_SUBMISSION)).toBe(false);
  });

  it("is true when the honeypot field is a non-empty string (triangulation)", () => {
    expect(
      isHoneypotTriggered({ ...VALID_SUBMISSION, company: "spambot inc" }),
    ).toBe(true);
  });

  it("is false when the honeypot field is an empty string", () => {
    expect(isHoneypotTriggered({ ...VALID_SUBMISSION, company: "" })).toBe(
      false,
    );
  });

  it("is false for non-object input (e.g. malformed JSON body)", () => {
    expect(isHoneypotTriggered(null)).toBe(false);
    expect(isHoneypotTriggered("not-an-object")).toBe(false);
  });
});
