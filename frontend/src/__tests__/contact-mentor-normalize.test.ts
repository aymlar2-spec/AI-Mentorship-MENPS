import { describe, it, expect } from "vitest";
import { normalizePhoneForWhatsApp } from "@/lib/phone";

describe("normalizePhoneForWhatsApp", () => {
  it("strips spaces, +, -, ( and ) exactly as specified", () => {
    expect(normalizePhoneForWhatsApp("+212 6 12 34 56 78")).toBe("212612345678");
  });

  it("handles dashes and parentheses", () => {
    expect(normalizePhoneForWhatsApp("(212) 6-12-34-56-78")).toBe("212612345678");
  });

  it("leaves an already-clean number unchanged", () => {
    expect(normalizePhoneForWhatsApp("212612345678")).toBe("212612345678");
  });
});
