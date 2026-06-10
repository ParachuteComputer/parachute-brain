/**
 * Module-scope auth wiring. Built ONCE — never per render.
 *
 * `surface.login()`          → drive OAuth, navigate to hub consent.
 * `surface.handleCallback()` → complete the flow on /oauth/callback.
 * `getLiveClient()`          → the one resilient VaultClient (see below).
 *
 * Why we don't use `surface.getClient()` directly: hub access tokens live
 * ~15 minutes, so EVERY return visit holds an expired-but-refreshable token.
 * Two gaps in surface-client 0.2.0 made that fatal:
 *
 *   1. Cold-load refresh throws — `refreshAccessToken()` needs the DCR
 *      client_id, which only `login()` / `handleCallback()` ever seed; the
 *      factory's `getClient()` onAuthError never seeds it, so the first
 *      refresh on a fresh page load fails before reaching the network.
 *   2. No single-flight — a view firing N parallel queries gets N 401s →
 *      N concurrent refreshes with the same rotating refresh token; the
 *      hub's replay detection (RFC 6819 posture) then revokes the whole
 *      token family. Every return visit was killing its own session.
 *
 * Both are fixed app-side here (seed-from-cache + single-flight) and filed
 * upstream — see Work/brain-reconnect-every-visit in the vault.
 */
import {
  createVaultSurface,
  loadToken,
  VaultClient,
} from "@openparachute/surface-client";

const HUB_URL = "https://our.parachute.computer";
// Exported so lib/identity.ts can read the same stored token this module
// writes (loadToken is keyed by app + vault scope).
export const VAULT_NAME = "default";
// Must match the factory's internal derivation: slugify("Parachute Brain").
export const APP_NAME = "parachute-brain";
// The factory's DCR registration cache key (create-vault-surface.ts).
const DCR_CACHE_KEY = `parachute_surface_dcr:${APP_NAME}`;

export const surface = createVaultSurface({
  clientName: "Parachute Brain",
  hubUrl: HUB_URL,
  vaultName: VAULT_NAME,
  // Base-aware so the callback is correct both at root (dev) and at the
  // GitHub Pages project path (https://…/parachute-brain/oauth/callback).
  redirectUri: `${window.location.origin}${import.meta.env.BASE_URL}oauth/callback`,
});

/**
 * Is there session material at all? An EXPIRED access token with a refresh
 * token still counts — the live client refreshes it on first use. This is
 * what the signed-in gate should check, NOT "is the token currently fresh".
 */
export function hasStoredSession(): boolean {
  return loadToken(APP_NAME, VAULT_NAME) !== null;
}

// ---- cold-load client_id seeding -------------------------------------------

let seeded = false;

function ensureClientIdSeeded(): void {
  if (seeded) return;
  try {
    const raw = window.localStorage.getItem(DCR_CACHE_KEY);
    if (!raw) return;
    // Assumes the cached registration matches HUB_URL + the current redirect
    // URI (true for this app's fixed constants). If the hub origin ever
    // migrates, a stale cache yields a wrong client_id → the refresh 401s
    // and falls through to signed-out — recoverable via Reconnect.
    const cached = JSON.parse(raw) as { clientId?: string };
    if (!cached.clientId) return;
    const stored = loadToken(APP_NAME, VAULT_NAME);
    surface.oauth.useClientId({
      client_id: cached.clientId,
      scopes: (stored?.scope ?? "vault:read vault:write")
        .split(/\s+/)
        .filter(Boolean),
    });
    seeded = true;
  } catch {
    // Leave unseeded — the refresh fails and surfaces as signed-out.
  }
}

// ---- single-flight refresh ---------------------------------------------------

let refreshInFlight: Promise<string | null> | null = null;

/** N concurrent 401s → ONE token-endpoint call; everyone shares the result. */
function singleFlightRefresh(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      ensureClientIdSeeded();
      const current = loadToken(APP_NAME, VAULT_NAME);
      const refreshToken = current?.refreshToken;
      if (!refreshToken) return null;
      const { token } = await surface.oauth.refreshAccessToken(
        refreshToken,
        VAULT_NAME,
      );
      return token.access_token;
    } catch (e) {
      // Genuine refresh failure (revoked family, hub down): report
      // signed-out; the ErrorBox offers Reconnect. Logged for diagnosis —
      // silent auth failures cost us days on this class of bug.
      console.error("[parachute-brain] token refresh failed:", e);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ---- the one live client -----------------------------------------------------

let liveClient: VaultClient | null = null;

/**
 * The resilient client every live read/write goes through. Null only when
 * there is no session material at all (never signed in / fully logged out).
 */
export function getLiveClient(): VaultClient | null {
  if (!hasStoredSession()) return null;
  liveClient ??= VaultClient.fromHub({
    hubOrigin: HUB_URL,
    vaultName: VAULT_NAME,
    // Re-read per request so rotated tokens are picked up immediately.
    tokenProvider: () => loadToken(APP_NAME, VAULT_NAME)?.accessToken ?? "",
    onAuthError: singleFlightRefresh,
  });
  return liveClient;
}
