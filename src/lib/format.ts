/**
 * Pure formatting + routing helpers shared across views and components.
 * Kept component-free so React Fast Refresh stays happy.
 */
import type { CSSProperties } from "react";
import { isDemo } from "../data/vault";

/** Humanize an enum label: in-progress → In progress. */
export function label(s?: string): string {
  if (!s) return "—";
  return s.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateShort(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Today's date as the vault keys it (YYYY-MM-DD, local time). Demo mode pins
 * to the fixture seed date so the demo daily-summary still surfaces.
 */
export function todayISO(): string {
  if (isDemo()) return "2026-06-02";
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Stagger delay for fade-up list entrances. */
export function staggerStyle(i: number): CSSProperties {
  return { animationDelay: `${Math.min(i, 12) * 55}ms` };
}

/** Encode a note path/id into the /n/* detail route. */
export function noteHref(idOrPath: string): string {
  return `/n/${encodeURI(idOrPath)}`;
}

/**
 * Map a `gh_links` token to its real GitHub URL.
 *
 * Work notes store gh_links as short repo slugs + an optional issue/PR number,
 * e.g. "hub#480", "vault#412", "surface#61", "patterns#91". The short slug maps
 * to the full repo under the ParachuteComputer org (NOT `openparachute` — that's
 * only the npm scope). Already-full slugs ("parachute-brain", "parachute.computer")
 * pass through unchanged. GitHub auto-redirects /issues/<n> → /pull/<n> for PRs,
 * so /issues/<n> is correct for both issues and PRs.
 */
const GH_SLUG_MAP: Record<string, string> = {
  hub: "parachute-hub",
  vault: "parachute-vault",
  surface: "parachute-surface",
  scribe: "parachute-scribe",
  runner: "parachute-runner",
  patterns: "parachute-patterns",
  workspace: "parachute-workspace",
  brain: "parachute-brain",
  channel: "parachute-channel",
  site: "parachute.computer",
};

export function ghLinkUrl(token: string): string {
  const hash = token.indexOf("#");
  const slug = hash === -1 ? token : token.slice(0, hash);
  const num = hash === -1 ? "" : token.slice(hash + 1);
  const full = slug.startsWith("parachute") ? slug : GH_SLUG_MAP[slug] ?? slug;
  const base = `https://github.com/ParachuteComputer/${full}`;
  return num ? `${base}/issues/${num}` : base;
}

/** Kebab slug for note paths (shared by meeting intake + the weave apply). */
export function slugify(s: string, fallback = "note"): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || fallback
  );
}

/** Relative freshness: "just now", "3h ago", "2d ago". */
export function fmtAgo(iso?: string): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
