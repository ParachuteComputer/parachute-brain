/**
 * The app shell: sticky topbar (dot-logo + wordmark, nav, theme toggle,
 * sign-out) wrapping the routed view. A thin demo banner when in demo mode.
 */
import { NavLink, Outlet } from "react-router-dom";
import { ParachuteLogo } from "./ParachuteLogo";
import { useTheme } from "./ThemeContext";
import { useSession } from "../data/SessionContext";

// Four job-shaped tabs. The type-views (Decisions / Meetings / Team / Strategy
// / Modules / Feedback) moved off the top nav and are reached via Library.
const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/work", label: "Work" },
  { to: "/weave", label: "Weave" },
  { to: "/library", label: "Library" },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="4.2" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7L5.3 5.3"
      />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5Z"
      />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2M9 12h11m0 0-3-3m3 3-3 3"
      />
    </svg>
  );
}

export function Shell() {
  const { theme, toggle } = useTheme();
  const { demo, logout } = useSession();

  return (
    <div className="shell">
      {demo && (
        <div className="demo-banner">
          <span className="pill-dot" style={{ width: 6, height: 6 }} />
          Demo mode — showing fixture data, not a live vault.
        </div>
      )}
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Parachute Brain home">
          <ParachuteLogo className="brand-logo" />
          <span className="brand-word">
            Parachute <span className="dim">Brain</span>
          </span>
        </NavLink>

        <nav className="nav" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <SignOutIcon />
          </button>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
