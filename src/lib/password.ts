// Shared password policy — used on both the signup form and the server so the
// rules can never be bypassed by calling the API directly.

export type PwRule = { id: string; label: string; test: (pw: string) => boolean };

export const PW_RULES: PwRule[] = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "digit", label: "One number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
  { id: "repeat", label: "No more than 3 identical characters in a row", test: (p) => !/(.)\1\1\1/.test(p) },
];

export function validatePassword(pw: string): { ok: boolean; errors: string[] } {
  const errors = PW_RULES.filter((r) => !r.test(pw)).map((r) => r.label);
  return { ok: errors.length === 0, errors };
}

/** Soft advisory (never enforced): is the user's name or phone inside the password? */
export function passwordUsesIdentity(pw: string, name?: string | null, phone?: string | null): boolean {
  if (!pw) return false;
  const p = pw.toLowerCase();
  if (name) {
    for (const part of name.toLowerCase().split(/\s+/)) {
      if (part.length >= 3 && p.includes(part)) return true;
    }
  }
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 4 && p.includes(digits.slice(-4))) return true;
  }
  return false;
}
