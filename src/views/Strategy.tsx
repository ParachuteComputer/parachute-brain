/**
 * Strategy — the living positions: documents that meetings feed and
 * decisions harden. Draft → active → superseded; supersession keeps the
 * trail of how the thinking evolved.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toStrategy } from "../data/model";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { strategyKindTint, strategyStatusTint } from "../data/schema";
import { fmtAgo, label, noteHref, staggerStyle } from "../lib/format";

const STATUS_ORDER: Record<string, number> = {
  active: 0,
  draft: 1,
  superseded: 2,
};

export function Strategy() {
  const { data, loading, error } = useNotes({
    tag: "strategy",
    include_metadata: "true",
    limit: "100",
  });

  const docs = useMemo(
    () =>
      (data ?? []).map(toStrategy).sort((a, b) => {
        const o =
          (STATUS_ORDER[a.status ?? ""] ?? 3) -
          (STATUS_ORDER[b.status ?? ""] ?? 3);
        if (o !== 0) return o;
        const at = a.note.updatedAt ?? a.note.createdAt ?? "";
        const bt = b.note.updatedAt ?? b.note.createdAt ?? "";
        return bt.localeCompare(at);
      }),
    [data],
  );

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="The living positions"
        title="Strategy"
        lead="Evolving documents — business plan, fundraising, positioning, product direction. Meetings feed them, decisions harden them; supersession keeps the trail."
      />

      {docs.length === 0 ? (
        <Empty
          title="No strategy docs yet"
          text="The first business plan or positioning doc will land here."
        />
      ) : (
        <div className="row-list">
          {docs.map((s, i) => (
            <Link
              key={s.id}
              to={noteHref(s.path)}
              className="card card-hover row fade-up"
              style={staggerStyle(i)}
            >
              <span className="row-date">
                {fmtAgo(s.note.updatedAt ?? s.note.createdAt)}
              </span>
              <span className="row-body">
                <span className="row-title">{s.title}</span>
                <span className="row-meta">
                  {s.status && (
                    <Pill tint={strategyStatusTint(s.status)} dot>
                      {label(s.status)}
                    </Pill>
                  )}
                  {s.kind && (
                    <Pill tint={strategyKindTint(s.kind)}>{label(s.kind)}</Pill>
                  )}
                </span>
                {s.summary && <span className="row-summary">{s.summary}</span>}
                {s.supersedes && (
                  <span
                    className="row-summary"
                    style={{ marginTop: 6, fontStyle: "italic" }}
                  >
                    ↳ supersedes {s.supersedes}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
