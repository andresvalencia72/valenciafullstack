import "@testing-library/jest-dom/vitest";

// jsdom does not implement `window.matchMedia`. Default to "no match"
// (i.e. the visitor does not prefer reduced motion / dark scheme) so
// component tests that read OS preferences (design-system: Theme
// Toggle, Motion Interactions) don't crash. Individual tests may
// override this per-case via `vi.spyOn(window, "matchMedia")`.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom has no IntersectionObserver implementation. Motion components
// (design-system: Motion Interactions — Reveal) use it via
// framer-motion's `whileInView`; this stub lets them mount under tests
// without crashing. Scroll-triggered reveal timing itself is a visual
// concern verified manually/in Playwright, not unit tests.
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  // @ts-expect-error -- minimal test stub, not a spec-complete implementation
  window.IntersectionObserver = IntersectionObserverStub;
  // @ts-expect-error -- mirror onto globalThis for code that reads the global directly
  globalThis.IntersectionObserver = IntersectionObserverStub;
}
