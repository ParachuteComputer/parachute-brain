/**
 * Pure formatting + routing helpers shared across views and components.
 * Kept component-free so React Fast Refresh stays happy.
 */
import type { CSSProperties } from "react";

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
 * Today's date as the vault stores it (YYYY-MM-DD). Pinned to the demo seed
 * date so the daily-summary surfaces in demo mode; against a live vault this
 * is the date the daily note is keyed by.
 */
export function todayISO(): string {
  return "2026-06-02";
}

/** Stagger delay for fade-up list entrances. */
export function staggerStyle(i: number): CSSProperties {
  return { animationDelay: `${Math.min(i, 12) * 55}ms` };
}

/** Encode a note path/id into the /n/* detail route. */
export function noteHref(idOrPath: string): string {
  return `/n/${encodeURI(idOrPath)}`;
}
