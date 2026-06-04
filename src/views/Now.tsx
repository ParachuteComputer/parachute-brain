/**
 * Now — mission control for the multi-agent workspace. Every in-flight
 * `work` claim (in-progress / in-review / blocked) grouped by assignee,
 * with repo chips (the collision radar) and updated-ago freshness; plus a
 * recently-shipped strip. The visual half of Orient → Claim → Log → Release.
 */
import { useMemo } from "react";
import type { Note } from "@openparachute/surface-client";
import { useNotes } from "../data/useNotes";
import { toWork } from "../data/model";
import { WorkCard } from "../components/WorkCard";
import { Loader, Empty, ErrorBox, Avatar } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { fmtAgo, staggerStyle } from "../lib/format";

const ACTIVE = JSON.stringify({
  status: { in: ["in-progress", "in-review", "blocked"] },
});
const SHIPPED = JSON.stringify({ status: { eq: "shipped" } });

function touched(n: Note): string {
  return n.updatedAt ?? n.createdAt;
}

export function Now() {
  const active = useNotes({
    tag: "work",
    metadata: ACTIVE,
    include_metadata: "true",
    limit: "200",
  });
  const shipped = useNotes({
    tag: "work",
    metadata: SHIPPED,
    include_metadata: "true",
    limit: "50",
  });

  const byAssignee = useMemo(() => {
    const items = (active.data ?? [])
      .slice()
      .sort((a, b) => touched(b).localeCompare(touched(a)));
    const map = new Map<string, Note[]>();
    for (const n of items) {
      const a =
        (typeof n.metadata?.assignee === "string" && n.metadata.assignee) ||
        "unclaimed";
      if (!map.has(a)) map.set(a, []);
      map.get(a)!.push(n);
    }
    return map;
  }, [active.data]);

  const recentShipped = useMemo(
    () =>
      (shipped.data ?? [])
        .slice()
        .sort((a, b) => touched(b).localeCompare(touched(a)))
        .slice(0, 6),
    [shipped.data],
  );

  if (active.loading) return <Loader />;
  if (active.error) return <ErrorBox message={active.error} />;

  // People first (alphabetical), the unclaimed pile last — it's the leak.
  const handles = [...byAssignee.keys()].sort((a, b) =>
    a === "unclaimed" ? 1 : b === "unclaimed" ? -1 : a.localeCompare(b),
  );

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Right now"
        title="Who's on what"
        lead="Every in-flight claim across the workspace — humans and agents alike. Check here before working in a repo someone else has claimed, or before restarting a shared daemon."
      />

      {handles.length === 0 ? (
        <Empty
          title="Nothing in flight"
          text="No claimed work right now. The floor is quiet."
        />
      ) : (
        handles.map((h) => {
          const items = byAssignee.get(h) ?? [];
          return (
            <section key={h} className="section">
              <div className="section-head">
                <h2
                  className="section-title"
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <Avatar name={h} /> {h}
                </h2>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {items.length} in flight
                </span>
              </div>
              <div className="grid grid-auto">
                {items.map((n, i) => (
                  <div key={n.id} className="fade-up" style={staggerStyle(i)}>
                    <WorkCard work={toWork(n)} showStatus />
                    <div
                      className="mono dim"
                      style={{ fontSize: "0.72rem", margin: "6px 2px 0" }}
                    >
                      touched {fmtAgo(touched(n))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      {recentShipped.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Recently shipped</h2>
          </div>
          <div className="grid grid-auto">
            {recentShipped.map((n, i) => (
              <div key={n.id} className="fade-up" style={staggerStyle(i)}>
                <WorkCard work={toWork(n)} />
                <div
                  className="mono dim"
                  style={{ fontSize: "0.72rem", margin: "6px 2px 0" }}
                >
                  shipped {fmtAgo(touched(n))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
