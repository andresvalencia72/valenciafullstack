import "@testing-library/jest-dom/vitest";

// Node >= 25 ships a built-in WebStorage `localStorage` global that
// shadows jsdom's and throws SecurityError unless the process runs with
// `--localstorage-file`. The previous escape hatch
// (NODE_OPTIONS=--no-webstorage) is rejected by Node 22 on CI, so the
// conflict is neutralized here instead: an in-memory Storage replaces
// the global on every Node version.
class InMemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

for (const target of [globalThis, typeof window === "undefined" ? undefined : window]) {
  if (target) {
    Object.defineProperty(target, "localStorage", {
      configurable: true,
      writable: true,
      value: new InMemoryStorage(),
    });
    Object.defineProperty(target, "sessionStorage", {
      configurable: true,
      writable: true,
      value: new InMemoryStorage(),
    });
  }
}

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
