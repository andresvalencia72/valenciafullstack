"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { HONEYPOT_FIELD_NAME } from "../application/contact-submission-schema";

type SubmitStatus = "idle" | "submitting" | "success" | "error" | "rate-limited";

interface ContactFormFields {
  name: string;
  email: string;
  message: string;
  [HONEYPOT_FIELD_NAME]: string;
}

const EMPTY_FIELDS: ContactFormFields = {
  name: "",
  email: "",
  message: "",
  [HONEYPOT_FIELD_NAME]: "",
};

/**
 * Functional contact form (contact: Server-Side Input Validation shape,
 * No PII Leakage in Responses; home-page: Section Composition —
 * contact). Wires the PR3b static shell's fields to `POST
 * /api/contact`; error feedback is generic-only — never derived from
 * the response body's internals, only from the HTTP status.
 */
export function ContactForm() {
  const t = useTranslations("home.contact");
  const locale = useLocale();
  const [fields, setFields] = useState<ContactFormFields>(EMPTY_FIELDS);
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const isSubmitting = status === "submitting";

  function updateField(field: keyof ContactFormFields) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, locale }),
      });

      if (response.ok) {
        setStatus("success");
        setFields(EMPTY_FIELDS);
        return;
      }

      setStatus(response.status === 429 ? "rate-limited" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4.5 rounded-2xl bg-ink p-7 text-bg lg:p-10"
    >
      <h3 className="mb-1.5 font-display text-2xl font-semibold tracking-tight">
        {t("formHeading")}
      </h3>

      <label className="flex flex-col gap-2 font-mono text-xs tracking-wide text-bg/65 uppercase">
        {t("nameLabel")}
        <input
          type="text"
          name="name"
          value={fields.name}
          onChange={updateField("name")}
          placeholder={t("namePlaceholder")}
          required
          maxLength={100}
          disabled={isSubmitting}
          className="rounded-lg border border-bg/30 bg-transparent px-3.5 py-3 text-sm text-bg outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 font-mono text-xs tracking-wide text-bg/65 uppercase">
        {t("emailLabel")}
        <input
          type="email"
          name="email"
          value={fields.email}
          onChange={updateField("email")}
          placeholder={t("emailPlaceholder")}
          required
          maxLength={254}
          disabled={isSubmitting}
          className="rounded-lg border border-bg/30 bg-transparent px-3.5 py-3 text-sm text-bg outline-none"
        />
      </label>

      <label className="flex flex-col gap-2 font-mono text-xs tracking-wide text-bg/65 uppercase">
        {t("messageLabel")}
        <textarea
          name="message"
          rows={5}
          value={fields.message}
          onChange={updateField("message")}
          placeholder={t("messagePlaceholder")}
          required
          maxLength={5000}
          disabled={isSubmitting}
          className="resize-vertical rounded-lg border border-bg/30 bg-transparent px-3.5 py-3 text-sm text-bg outline-none"
        />
      </label>

      {/* Honeypot (contact: Spam Mitigation) — invisible and unreachable
       * to real visitors and assistive technology alike: aria-hidden,
       * removed from the tab order, positioned off-screen rather than
       * `display: none` (some bots skip display:none fields). */}
      <span aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input
          type="text"
          name={HONEYPOT_FIELD_NAME}
          value={fields[HONEYPOT_FIELD_NAME]}
          onChange={updateField(HONEYPOT_FIELD_NAME)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </span>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex w-fit items-center gap-2 rounded-xl bg-coral px-7.5 py-4 text-sm font-semibold text-coral-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("submit")}
      </button>

      {status === "success" && (
        <p role="status" className="text-xs text-bg/80">
          {t("successMessage")}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="text-xs text-bg/80">
          {t("errorGenericMessage")}
        </p>
      )}
      {status === "rate-limited" && (
        <p role="alert" className="text-xs text-bg/80">
          {t("errorRateLimitedMessage")}
        </p>
      )}
    </form>
  );
}
