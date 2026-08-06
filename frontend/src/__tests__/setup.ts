import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView — stub it so components that call
// it (e.g. AIChat's auto-scroll-to-bottom) don't crash in tests.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
