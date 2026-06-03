/**
 * /oauth/callback — completes the OAuth dance, then routes home (or back to
 * Connect on failure).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { surface } from "../data/surface";
import { Loader } from "../components/ui";

export function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    surface
      .handleCallback()
      .then(() => {
        if (alive) navigate("/", { replace: true });
      })
      .catch((e: unknown) => {
        if (alive)
          setError(
            e instanceof Error ? e.message : "Sign-in could not be completed.",
          );
      });
    return () => {
      alive = false;
    };
  }, [navigate]);

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
