/**
 * Pure formatting + routing helpers shared across views and components.
 * Kept component-free so React Fast Refresh stays happy.
 */
import type { CSSProperties } from "react";
import type { Note } from "@openparachute/surface-client";
import { isDemo } from "../data/vault";

/**
 * Count a note's OUTBOUND links of a given relationship — the note is the
 * source end (`sourceId === note.id`). Powers the at-a-glance card chips
 * ("drives N" on a feedback theme, "affects N" on a decision). Returns 0 when
 * the note carries no links (queried without `include_links`).
 */
export function countOutboundLinks(note: Note, relationship: string): number {
  return (note.links ?? []).filter(
    (l) => l.sourceId === note.id && l.relationship === relationship,
  ).length;
}

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

/**
 * Kebab slug for note paths (shared by meeting intake + the weave apply).
 *
 * Capped at ~8 words / ~60 chars, always cutting at a word boundary — a long
 * title must never truncate mid-word (issue #16: a weave apply once minted
 * `...-team-vault-site-as-sur`). The only mid-word cut left is the degenerate
 * single-token-over-60-chars case, where no boundary exists to cut at.
 */
export function slugify(s: string, fallback = "note"): string {
  const words = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean);
  const kept: string[] = [];
  for (const w of words) {
    if (kept.length >= 8) break;
    if (kept.length > 0 && kept.join("-").length + 1 + w.length > 60) break;
    kept.push(w);
  }
  return kept.join("-").slice(0, 60) || fallback;
}

/**
 * Repo slugs EXPLICITLY mentioned in a blob of text (a proposal's target_path
 * + evidence) — the conservative input to the weave apply's `repo/<slug>`
 * tagging. Two explicit forms only, both validated against the known repo set:
 *
 *  - full repo names: "parachute-vault", "parachute.computer"
 *  - gh-link tokens:  "hub#480", "vault#412" (the `gh_links` shorthand)
 *
 * Prose words like "hub" or "site" alone never match — deriving a repo from
 * loose prose is exactly the over-inference the apply must not do.
 */
export function deriveRepoSlugs(text: string): string[] {
  const known = new Set(Object.values(GH_SLUG_MAP));
  const found = new Set<string>();
  for (const full of known) {
    if (text.includes(full)) found.add(full);
  }
  for (const m of text.matchAll(/\b([a-z]+)#\d+/g)) {
    const full = GH_SLUG_MAP[m[1] ?? ""];
    if (full) found.add(full);
  }
  return [...found].sort();
}

/**
 * Is a task's `claim_expires` a *future* ISO instant? A future expiry means
 * the soft claim is still live (someone holds it); empty, malformed, or past
 * all read as unclaimed / free to pick up. Anchored to the demo seed date in
 * demo mode so fixtures with a fixed-future expiry stay "claimed".
 */
export function isClaimActive(claimExpires?: string): boolean {
  if (!claimExpires) return false;
  const t = new Date(claimExpires).getTime();
  if (Number.isNaN(t)) return false;
  const now = isDemo()
    ? new Date(todayISO() + "T00:00:00Z").getTime()
    : Date.now();
  return t > now;
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
