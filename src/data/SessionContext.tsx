/**
 * Session context: holds the signed-in state (live token or demo) without
 * rebuilding the VaultClient per render. `surface.getClient()` is read once
 * into a ref; we only re-derive when the identity changes (sign in/out).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { surface } from "./surface";
import { isDemo, setDemo } from "./vault";

interface Session {
  signedIn: boolean;
  demo: boolean;
  login: () => Promise<void>;
  logout: () => void;
  enterDemo: () => void;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [demo, setDemoState] = useState(() => isDemo());
  // Read the live token once at mount; we only flip this explicitly on
  // logout. `login()` navigates the browser away, so it never needs to
  // update state in place.
  const [hasToken, setHasToken] = useState(() => surface.getClient() !== null);

  const login = useCallback(async () => {
    await surface.login();
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
    () => ({ signedIn: demo || hasToken, demo, login, logout, enterDemo }),
    [demo, hasToken, login, logout, enterDemo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}
