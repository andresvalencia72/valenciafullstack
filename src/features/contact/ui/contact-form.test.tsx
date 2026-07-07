import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/shared/i18n/messages/en.json";
import { ContactForm } from "./contact-form";

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ContactForm />
    </NextIntlClientProvider>,
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Andrés Valencia" },
  });
  fireEvent.change(screen.getByLabelText("Your email"), {
    target: { value: "andres@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Message"), {
    target: { value: "Hello from the test suite" },
  });
}

describe("ContactForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders name, email, and message inputs, enabled (contact: Server-Side Input Validation shape)", () => {
    renderForm();

    expect(screen.getByLabelText("Your name")).toBeEnabled();
    expect(screen.getByLabelText("Your email")).toBeEnabled();
    expect(screen.getByLabelText("Message")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("renders a hidden honeypot field named 'company', excluded from the tab order and accessibility tree (contact: Spam Mitigation)", () => {
    renderForm();

    const honeypot = document.querySelector('input[name="company"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(screen.queryByLabelText(/company/i)).toBeNull();
  });

  it("submits the form data (incl. locale) to POST /api/contact and shows a success message (contact: Valid submission)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "sent" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Thanks — your message is on its way. I'll get back to you soon.",
      );
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/contact",
      expect.objectContaining({ method: "POST" }),
    );
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(requestInit.body as string)).toEqual({
      name: "Andrés Valencia",
      email: "andres@example.com",
      message: "Hello from the test suite",
      locale: "en",
      company: "",
    });
  });

  it("shows a generic error message on a 400 response, without leaking any server detail (security: No PII or Internal Detail Leakage)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ status: "invalid", message: "Invalid submission." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong on our side. Please try again in a moment.",
      );
    });
  });

  it("shows a distinct rate-limit message on a 429 response (triangulation)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ status: "rate_limited" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "You're sending messages a bit too fast. Please wait a few minutes and try again.",
      );
    });
  });

  it("shows the generic error message when the request itself throws (network failure, triangulation)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong on our side. Please try again in a moment.",
      );
    });
  });

  it("disables the submit button while the request is pending", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderForm();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();

    resolveFetch({ ok: true, status: 200, json: async () => ({ status: "sent" }) });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
    });
  });
});
