/**
 * Who is signed in? The app-layer identity convention.
 *
 * The vault has no native author column yet, so the brain stamps an `author`
 * metadata field (+ a `captured-by` graph link) on everything it creates.
 * The handle comes from the stored hub access token — a JWT whose payload
 * carries the subject. Decoding is purely best-effort and DEFENSIVE: any
 * surprise (no token, opaque token, malformed payload) reads as null, never
 * a throw. Null in demo mode — the demo banner already communicates state.
 */
import { loadToken } from "@openparachute/surface-client";
import { APP_NAME, VAULT_NAME } from "../data/surface";

/**
 * UUID-shaped values are user IDS, not handles. Today the hub mints
 * `sub: users.id` (a `crypto.randomUUID()` — see hub `oauth-handlers.ts` /
 * `users.ts`) with no username claim, so a UUID `sub` must not become the
 * chrome chip or an `author` stamp — "" / hidden beats a meaningless UUID
 * in the graph. The day hub adds `preferred_username` (or flips `sub` to
 * the username), this resolves to the real handle with no app change.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asHandle(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 && !UUID_RE.test(v) ? v : null;
}

export function signedInHandle(): string | null {
  try {
    const jwt = loadToken(APP_NAME, VAULT_NAME)?.accessToken;
    if (!jwt) return null;
    const parts = jwt.split(".");
    const seg = parts[1];
    if (!seg) return null;
    // base64url → base64 (+ padding), then bytes → UTF-8 → JSON.
    const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Record<
      string,
      unknown
    >;
    return (
      asHandle(payload.sub) ??
      asHandle(payload.preferred_username) ??
      asHandle(payload.username)
    );
  } catch {
    return null;
  }
}
