/**
 * /oauth/callback — completes the OAuth dance, refreshes the session state,
 * then routes home (or back to Connect on failure).
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { surface } from "../data/surface";
import { useSession } from "../data/SessionContext";
import { Loader } from "../components/ui";

export function OAuthCallback() {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  // The ?code in the URL is single-use — guard against double invocation
  // (StrictMode re-runs effects in dev and would exchange it twice).
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    surface
      .handleCallback()
      .then(() => {
        // The token is stored now. Refresh the session BEFORE navigating —
        // the signed-in gate otherwise still sees the stale pre-callback
        // state and bounces to /connect (the "log in twice" bug).
        refresh();
        navigate("/", { replace: true });
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error ? e.message : "Sign-in could not be completed.",
        );
      });
  }, [navigate, refresh]);

  if (error) {
    return (
      <div className="connect-wrap">
        <div className="connect-card">
          <h2>Sign-in didn't complete</h2>
          <p className="connect-sub">{error}</p>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/connect", { replace: true })}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <Loader text="Completing sign-in…" />;
}
