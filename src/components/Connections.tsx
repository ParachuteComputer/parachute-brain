/**
 * Connections — the graph-edge panel. Surfaces a note's typed relationship
 * links (inbound + outbound) as a calm, grouped list so the connective tissue
 * of the vault reads at a glance: feedback → drives → work, decision → affects
 * → work, meeting → mentions → person, task → part_of → arc.
 *
 * Each link is direction-aware relative to `selfId`: outbound when this note is
 * the source (the other end is the target), inbound when this note is the
 * target (the other end is the source). The other end's title + href come from
 * the echoed `targetNote` / `sourceNote` inlined by `include_links` — no extra
 * fetch. Links are grouped under a HUMANIZED, direction-aware relationship
 * label so "Drives" (outbound) and "Driven by" (inbound) read distinctly.
 *
 * Inbound `part_of` links are skipped — those are an arc's tasks, already
 * rendered by <ArcTasks>; surfacing them here would double them up. If nothing
 * remains after that skip, the panel renders nothing (no empty shell).
 */
import { Link } from "react-router-dom";
import type { NoteLink, NoteSummary } from "@openparachute/surface-client";
import { titleOf } from "../data/model";
import { noteHref } from "../lib/format";

/**
 * Direction-aware humanized labels per relationship: [outbound, inbound].
 * outbound = this note is the SOURCE; inbound = this note is the TARGET.
 */
const REL_LABELS: Record<string, [string, string]> = {
  drives: ["Drives", "Driven by"],
  synthesized_from: ["Synthesized from", "Feeds"],
  part_of: ["Part of", "Tasks"],
  affects: ["Affects", "Affected by"],
  informed_by: ["Informed by", "Informs"],
  produced: ["Produced", "Produced by"],
  spawned: ["Spawned", "Spawned by"],
  mentions: ["Mentions", "Mentioned in"],
  supersedes: ["Supersedes", "Superseded by"],
  superseded_by: ["Superseded by", "Supersedes"],
  "reported-by": ["Reported by", "Reported"],
  follows: ["Follows", "Followed by"],
  founder: ["Founder of", "Founder"],
  wikilink: ["Related", "Related"],
};

/** Humanize an unmapped relationship: `informed_by` → "Informed by". */
function humanize(rel: string): string {
  return rel
    .replace(/[-_]/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** The direction-aware label for a relationship + direction. */
function relLabel(rel: string, outbound: boolean): string {
  const pair = REL_LABELS[rel];
  if (pair) return outbound ? pair[0] : pair[1];
  const h = humanize(rel);
  return h;
}

/** A NoteSummary is shaped like a Note for titleOf's purposes. */
function summaryTitle(summary: NoteSummary | undefined, fallbackId: string): {
  path: string;
  title: string;
} {
  const path = summary?.path ?? fallbackId;
  const title = summary
    ? titleOf({ ...summary, createdAt: summary.createdAt ?? "" })
    : fallbackId;
  return { path, title };
}

interface Edge {
  href: string;
  title: string;
  key: string;
}

export function Connections({
  links,
  selfId,
}: {
  links: NoteLink[];
  selfId: string;
}) {
  // Group resolved edges under their direction-aware label, preserving first-
  // seen order so the panel reads stably across renders.
  const groups = new Map<string, Edge[]>();

  links.forEach((l, i) => {
    const outbound = l.sourceId === selfId;
    // Defensive: a link where neither end is self shouldn't appear, but if it
    // does (self-loop or echoed oddly), treat sourceId===selfId as outbound.
    const inbound = l.targetId === selfId && !outbound;

    // Skip inbound part_of — those are the arc's tasks, rendered by <ArcTasks>.
    if (inbound && l.relationship === "part_of") return;

    const other = outbound ? l.targetNote : l.sourceNote;
    const otherId = outbound ? l.targetId : l.sourceId;
    const { path, title } = summaryTitle(other, otherId);

    const lbl = relLabel(l.relationship, outbound);
    const edge: Edge = {
      href: noteHref(path),
      title,
      key: `${l.relationship}-${otherId}-${i}`,
    };
    const bucket = groups.get(lbl);
    if (bucket) bucket.push(edge);
    else groups.set(lbl, [edge]);
  });

  if (groups.size === 0) return null;

  return (
    <div className="meta-block">
      <div className="meta-block-title">Connections</div>
      <div className="connections">
        {[...groups.entries()].map(([lbl, edges]) => (
          <div key={lbl} className="connection-group">
            <div className="connection-rel">{lbl}</div>
            <div className="linked-list">
              {edges.map((e) => (
                <Link key={e.key} to={e.href} className="linked-item">
                  {e.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
