/**
 * Decisions — reverse-chronological by decided_on; scope filter; status +
 * scope + date + summary; supersession trail when present.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toDecision } from "../data/model";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import {
  DECISION_SCOPES,
  decisionTint,
  type DecisionScope,
} from "../data/schema";
import {
  countOutboundLinks,
  fmtDate,
  label,
  noteHref,
  staggerStyle,
} from "../lib/format";

export function Decisions() {
  const { data, loading, error } = useNotes({
    tag: "decision",
    include_metadata: "true",
    include_links: "true",
    sort: "-decided_on",
    limit: "500",
  });
  const [scope, setScope] = useState<DecisionScope | "">("");

  const decisions = useMemo(() => {
    const all = (data ?? [])
      .map(toDecision)
      .sort((a, b) => (b.decidedOn ?? "").localeCompare(a.decidedOn ?? ""));
    return scope ? all.filter((d) => d.scope === scope) : all;
  }, [data, scope]);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="The record"
        title="Decisions"
        lead="The calls we've made, newest first — what we chose, why, and what it changed."
      />

      <div className="filterbar">
        <span className="filter-label">Scope</span>
        <button
          type="button"
          className={`repo-chip${scope === "" ? " active" : ""}`}
          onClick={() => setScope("")}
        >
          All
        </button>
        {DECISION_SCOPES.map((s) => (
          <button
            key={s}
            type="button"
            className={`repo-chip${scope === s ? " active" : ""}`}
            onClick={() => setScope(scope === s ? "" : s)}
          >
            {label(s)}
          </button>
        ))}
      </div>

      {decisions.length === 0 ? (
        <Empty title="No decisions in this scope" />
      ) : (
        <div className="row-list">
          {decisions.map((d, i) => (
            <Link
              key={d.id}
              to={noteHref(d.path)}
              className="card card-hover row fade-up"
              style={staggerStyle(i)}
            >
              <span className="row-date">{fmtDate(d.decidedOn)}</span>
              <span className="row-body">
                <span className="row-title">{d.title}</span>
                <span className="row-meta">
                  <Pill tint={decisionTint(d.status)} dot>
                    {label(d.status)}
                  </Pill>
                  {d.scope && <Pill tint="lavender">{label(d.scope)}</Pill>}
                  {(() => {
                    const affects = countOutboundLinks(d.note, "affects");
                    return affects > 0 ? (
                      <span className="edge-chip">affects {affects}</span>
                    ) : null;
                  })()}
                </span>
                {d.summary && <span className="row-summary">{d.summary}</span>}
                {d.supersededBy && (
                  <span
                    className="row-summary"
                    style={{ marginTop: 6, fontStyle: "italic" }}
                  >
                    ↳ superseded by {d.supersededBy}
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
