/**
 * Shared brand primitives: pills, repo chips, avatars, loader, empty state.
 * Hand-crafted; no UI kit.
 */
import type { ReactNode } from "react";
import { ParachuteLogo } from "./ParachuteLogo";
import { useSession } from "../data/SessionContext";
import {
  avatarColor,
  initials,
  repoColor,
  repoLabel,
  type Tint,
} from "../data/schema";

export function Pill({
  tint = "stone",
  dot = false,
  children,
}: {
  tint?: Tint;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`pill ${tint}${dot ? " pill-dot" : ""}`}>{children}</span>
  );
}

export function RepoChip({
  repo,
  active,
  onClick,
}: {
  repo: string;
  active?: boolean;
  onClick?: (repo: string) => void;
}) {
  const content = (
    <>
      <span className="dot" style={{ background: repoColor(repo) }} />
      {repoLabel(repo)}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={`repo-chip${active ? " active" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick(repo);
        }}
        title={repo}
      >
        {content}
      </button>
    );
  }
  return (
    <span className={`repo-chip${active ? " active" : ""}`} title={repo}>
      {content}
    </span>
  );
}

export function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={size === "lg" ? "avatar-lg" : "avatar"}
      style={{ background: avatarColor(name) }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function Loader({ text = "Gathering the vault…" }: { text?: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <ParachuteLogo className="loader-dot" />
      <span className="loader-text">{text}</span>
    </div>
  );
}

export function Empty({
  title = "Nothing here yet",
  text,
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <ParachuteLogo className="empty-icon" />
      <div className="empty-title">{title}</div>
      {text && <div className="empty-text">{text}</div>}
    </div>
  );
}

/**
 * Error state with recovery. Transient blips (a hub restart reads as the
 * browser's literal "Failed to fetch") get "Try again"; a dead session gets
 * "Reconnect" — re-runs the OAuth bounce, which the hub fast-tracks when the
 * consent session is still alive. No manual sign-out needed for either.
 */
export function ErrorBox({ message }: { message: string }) {
  const { demo, login } = useSession();
  // Case-insensitive contains — the literal browser string isn't spec'd.
  const friendly = /failed to fetch/i.test(message)
    ? "Couldn't reach the vault — it may have blinked (a restart or a dropped connection)."
    : message;
  return (
    <div className="inline-error" role="alert">
      <p className="inline-error-msg">{friendly}</p>
      <div className="inline-error-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
        {!demo && (
          <button type="button" className="btn" onClick={() => void login()}>
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
}
