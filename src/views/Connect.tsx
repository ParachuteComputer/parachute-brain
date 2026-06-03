/**
 * Connect — the on-brand sign-in. Logo, a calm welcome, one button to the
 * vault, and a quiet demo-mode link.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ParachuteLogo } from "../components/ParachuteLogo";
import { useSession } from "../data/SessionContext";

export function Connect() {
  const { login, enterDemo } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConnect() {
    setBusy(true);
    setError(null);
    try {
      await login();
      // login() navigates the browser to the hub; if it returns without
      // navigating (non-DOM), fall through.
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof Error ? e.message : "Could not start the sign-in flow.",
      );
    }
  }

  function onDemo() {
    enterDemo();
    navigate("/");
  }

  return (
    <div className="connect-wrap">
      <div className="connect-sky" aria-hidden="true" />
      <div className="connect-card fade-up">
        <ParachuteLogo className="connect-logo" />
        <p className="eyebrow">Parachute Brain</p>
        <h1 className="connect-title">Welcome back.</h1>
        <p className="connect-sub">
          The team's calm window onto the project vault — work, decisions,
          feedback, and the people behind them, in one quiet place.
        </p>
        <button
          type="button"
          className="btn btn-lg"
          onClick={onConnect}
          disabled={busy}
        >
          {busy ? "Opening the hub…" : "Connect to the vault"}
        </button>
        {error && (
          <p className="connect-demo" style={{ color: "var(--tint-terracotta-fg)" }}>
            {error}
          </p>
        )}
        <p className="connect-demo">
          Just looking?{" "}
          <a
            href="/?demo=1"
            onClick={(e) => {
              e.preventDefault();
              onDemo();
            }}
          >
            Explore in demo mode →
          </a>
        </p>
      </div>
    </div>
  );
}
