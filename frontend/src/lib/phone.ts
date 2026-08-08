/**
 * Normalizes a phone number for use in a wa.me WhatsApp link by stripping
 * spaces, '+', '-', '(', and ')'.
 *
 * Example: "+212 6 12 34 56 78" -> "212612345678"
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s+\-()]/g, "");
}
