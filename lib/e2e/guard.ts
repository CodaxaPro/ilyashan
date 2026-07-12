/** E2E-only routes — never enable in production without explicit flag. */
export function isE2eModeEnabled(): boolean {
  return process.env.E2E_MODE === "true" || process.env.NODE_ENV === "test";
}

export function assertE2eAuthorized(request: Request): boolean {
  if (!isE2eModeEnabled()) return false;
  const header = request.headers.get("authorization");
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return header === `Bearer ${expected}`;
}
