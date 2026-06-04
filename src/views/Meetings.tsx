/**
 * Meetings — a timeline by held_on, grouped by series; status badge.
 * Click → meeting detail (digest + produced decisions / spawned work).
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toMeeting } from "../data/model";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { AddMeetingModal } from "../components/AddMeetingModal";
import { MEETING_SERIES, meetingStatusTint } from "../data/schema";
import { label, fmtDate, noteHref, staggerStyle } from "../lib/format";

const SERIES_LABEL: Record<string, string> = {
  "parachute-weekly": "Parachute Weekly",
  "techne-lca": "Techne · LCA",
  "gamescoop-friday": "Gamescoop Friday",
  "gitcoin-sync": "Gitcoin Sync",
  fundraising: "Fundraising",
  "ad-hoc": "Ad hoc",
};

export function Meetings() {
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const { data, loading, error } = useNotes({
    tag: "meeting",
    include_metadata: "true",
    sort: "-held_on",
    limit: "500",
  });

  const grouped = useMemo(() => {
    const all = (data ?? [])
      .map(toMeeting)
      .sort((a, b) => (b.heldOn ?? "").localeCompare(a.heldOn ?? ""));
    const map = new Map<string, typeof all>();
    for (const s of MEETING_SERIES) map.set(s, []);
    for (const m of all) {
      const s = m.series ?? "ad-hoc";
      (map.get(s) ?? map.get("ad-hoc")!).push(m);
    }
    return map;
  }, [data]);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;

  const activeSeries = MEETING_SERIES.filter(
    (s) => (grouped.get(s)?.length ?? 0) > 0,
  );

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="When we gathered"
        title="Meetings"
        lead="A timeline of where the conversations happened — and what they produced."
      />

      <div className="page-actions">
        <button type="button" className="btn" onClick={() => setAdding(true)}>
          + Add meeting
        </button>
      </div>
      <AddMeetingModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(p) => {
          setAdding(false);
          navigate(noteHref(p));
        }}
      />

      {activeSeries.length === 0 ? (
        <Empty title="No meetings recorded" />
      ) : (
        activeSeries.map((series) => {
          const items = grouped.get(series) ?? [];
          return (
            <div key={series} className="timeline-group">
              <div className="timeline-group-head">
                <h2 className="section-title">{SERIES_LABEL[series] ?? series}</h2>
                <span className="kanban-col-count">{items.length}</span>
              </div>
              <div className="timeline">
                {items.map((m, i) => (
                  <div
                    key={m.id}
                    className="timeline-item fade-up"
                    style={staggerStyle(i)}
                  >
                    <Link
                      to={noteHref(m.path)}
                      className="card card-hover card-pad"
                    >
                      <div
                        className="row-meta"
                        style={{ justifyContent: "space-between" }}
                      >
                        <span className="row-title" style={{ margin: 0 }}>
                          {m.title}
                        </span>
                        <Pill tint={meetingStatusTint(m.status)} dot>
                          {label(m.status)}
                        </Pill>
                      </div>
                      <div
                        className="mono dim"
                        style={{ fontSize: "0.74rem", marginTop: 4 }}
                      >
                        {fmtDate(m.heldOn)}
                      </div>
                      {m.summary && (
                        <p className="row-summary" style={{ marginTop: 8 }}>
                          {m.summary}
                        </p>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
