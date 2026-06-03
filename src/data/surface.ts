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
});
