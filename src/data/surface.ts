/**
 * Module-scope auth wiring. Built ONCE — never per render.
 *
 * `surface.login()`        → drive OAuth, navigate to hub consent.
 * `surface.handleCallback()` → complete the flow on /oauth/callback.
 * `surface.getClient()`    → a VaultClient (null if not signed in).
 */
import { createVaultSurface } from "@openparachute/surface-client";

export const surface = createVaultSurface({
  clientName: "Parachute Brain",
  hubUrl: "https://our.parachute.computer",
  vaultName: "default",
  // Base-aware so the callback is correct both at root (dev) and at the
  // GitHub Pages project path (https://…/parachute-brain/oauth/callback).
  redirectUri: `${window.location.origin}${import.meta.env.BASE_URL}oauth/callback`,
});
