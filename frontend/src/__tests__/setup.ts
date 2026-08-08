import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom doesn't implement scrollIntoView — stub it so components that call
// it (e.g. AIChat's auto-scroll-to-bottom) don't crash in tests.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Explicit unmount + DOM cleanup after every test. Without this, elements
// rendered by one test can leak into the next test's queries (RTL's
// automatic afterEach cleanup isn't reliably auto-registered in every
// Vitest/environment combination), causing false positives/negatives when
// multiple tests in the same file render similar components.
afterEach(() => {
  cleanup();
});
