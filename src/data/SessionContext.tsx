/**
 * Session context: holds the signed-in state (live session or demo).
 * Signed-in means hasStoredSession() — session material exists, even if the
 * access token is expired (the live client refreshes it on first use).
 * Re-derived on logout and via refresh() after the OAuth callback.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hasStoredSession, surface } from "./surface";
import { isDemo, setDemo } from "./vault";

interface Session {
  signedIn: boolean;
  demo: boolean;
  login: () => Promise<void>;
  logout: () => void;
  enterDemo: () => void;
  /** Re-read the stored token — call after the OAuth callback completes. */
  refresh: () => void;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [demo, setDemoState] = useState(() => isDemo());
  // Read the live token once at mount; flipped on logout, and re-read via
  // refresh() after the OAuth callback stores a fresh token. (The callback is
  // an SPA navigate — this provider does NOT remount — so without the refresh
  // the signed-in gate still sees the stale pre-callback state and bounces
  // back to /connect: the "have to log in twice" bug.)
  // hasStoredSession, NOT getClient(): an expired-but-refreshable token is
  // still a session — the live client refreshes it on first use. Treating
  // "expired" as "signed out" is what bounced every return visit to /connect.
  const [hasToken, setHasToken] = useState(() => hasStoredSession());

  const login = useCallback(async () => {
    await surface.login();
  }, []);

  const refresh = useCallback(() => {
    setHasToken(hasStoredSession());
  }, []);

  const logout = useCallback(() => {
    surface.logout();
    setDemo(false);
    setDemoState(false);
    setHasToken(false);
  }, []);

  const enterDemo = useCallback(() => {
    setDemo(true);
    setDemoState(true);
  }, []);

  const value = useMemo<Session>(
    () => ({
      signedIn: demo || hasToken,
      demo,
      login,
      logout,
      enterDemo,
      refresh,
    }),
    [demo, hasToken, login, logout, enterDemo, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}
