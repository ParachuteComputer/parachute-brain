/**
 * Today — the team-sync home. Daily summary at top (if present), a
 * "where things stand" header with counts, then active work, recent
 * decisions, needs-review, open feedback, and meetings.
 */
import { Link } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import {
  toDecision,
  toFeedbackTheme,
  toMeeting,
  toProposal,
  toWork,
} from "../data/model";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { WorkCard } from "../components/WorkCard";
import { NoteBody } from "../components/NoteBody";
import {
  decisionTint,
  feedbackStatusTint,
  meetingStatusTint,
} from "../data/schema";
import {
  label,
  fmtDate,
  fmtDateShort,
  noteHref,
  staggerStyle,
  todayISO,
} from "../lib/format";

export function Today() {
  const work = useNotes({ tag: "work", include_metadata: "true", limit: "200" });
  const decisions = useNotes({
    tag: "decision",
    include_metadata: "true",
    sort: "-decided_on",
    limit: "200",
  });
  const themes = useNotes({
    tag: "feedback-theme",
    include_metadata: "true",
    limit: "200",
  });
  const proposals = useNotes({
    tag: "proposal",
    include_metadata: "true",
    limit: "200",
  });
  const meetings = useNotes({
    tag: "meeting",
    include_metadata: "true",
    sort: "-held_on",
    limit: "200",
  });
  const daily = useNotes({ path_prefix: `summaries/daily/${todayISO()}` });

  if (
    work.loading ||
    decisions.loading ||
    themes.loading ||
    proposals.loading ||
    meetings.loading
  )
    return <Loader />;

  const err =
    work.error || decisions.error || themes.error || proposals.error;
  if (err) return <ErrorBox message={err} />;

  const works = (work.data ?? []).map(toWork);
  const inProgress = works.filter((w) => w.status === "in-progress");
  const blocked = works.filter((w) => w.status === "blocked");
  const active = [...inProgress, ...blocked];

  const decs = (decisions.data ?? []).map(toDecision);
  const recentAccepted = decs
    .filter((d) => d.status === "accepted")
    .slice(0, 3);

  const allThemes = (themes.data ?? []).map(toFeedbackTheme);
  const openFeedback = allThemes.filter(
    (t) =>
      (t.severity === "p0" || t.severity === "p1") &&
      t.status !== "resolved" &&
      t.status !== "wontfix",
  );

  const pending = (proposals.data ?? [])
    .map(toProposal)
    .filter((p) => p.status === "pending");

  const meets = (meetings.data ?? []).map(toMeeting).slice(0, 4);
  const dailyNote = daily.data?.[0];

  return (
    <div className="page-enter">
      {dailyNote && (
        <div className="daily-banner fade-up">
          <p className="eyebrow">Daily sync · {fmtDate(todayISO())}</p>
          <NoteBody note={dailyNote} />
        </div>
      )}

      <PageHeader
        eyebrow="The view from up here"
        title="Where things stand"
        lead="A calm read on the work in flight, the calls we've made, and what's waiting on the team."
      >
        <div className="stat-row">
          <Stat n={inProgress.length} cls="accent" label="in progress" />
          <Stat n={blocked.length} cls="warn" label="blocked" />
          <Stat n={pending.length} cls="" label="pending proposals" />
          <Stat
            n={openFeedback.length}
            cls="alert"
            label="open p0 / p1 feedback"
          />
        </div>
      </PageHeader>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Active work</h2>
          <Link to="/work" className="section-link">
            All work →
          </Link>
        </div>
        {active.length === 0 ? (
          <Empty title="Nothing in flight" text="No in-progress or blocked work right now." />
        ) : (
          <div className="grid grid-auto">
            {active.map((w, i) => (
              <div key={w.id} className="fade-up" style={staggerStyle(i)}>
                <WorkCard work={w} showStatus />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Recent decisions</h2>
            <Link to="/decisions" className="section-link">
              All →
            </Link>
          </div>
          <div className="row-list">
            {recentAccepted.map((d, i) => (
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
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Needs review</h2>
            <Link to="/weave" className="section-link">
              Open Weave →
            </Link>
          </div>
          <Link to="/weave" className="card card-hover card-pad fade-up">
            <div className="stat-num accent" style={{ fontSize: "3rem" }}>
              {pending.length}
            </div>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {pending.length === 1 ? "proposal" : "proposals"} waiting in the
              Weave queue — entities and links the team can approve or set
              aside.
            </p>
          </Link>
        </section>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Open feedback</h2>
            <Link to="/feedback" className="section-link">
              All themes →
            </Link>
          </div>
          {openFeedback.length === 0 ? (
            <Empty title="Inbox calm" text="No open p0 / p1 themes." />
          ) : (
            <div className="row-list">
              {openFeedback.map((t, i) => (
                <Link
                  key={t.id}
                  to={noteHref(t.path)}
                  className="card card-hover row fade-up"
                  style={staggerStyle(i)}
                >
                  <span className="row-body">
                    <span className="row-title">{t.title}</span>
                    <span className="row-meta">
                      {t.severity && (
                        <Pill tint={t.severity === "p0" ? "terracotta" : "amber"}>
                          {t.severity.toUpperCase()}
                        </Pill>
                      )}
                      <Pill tint={feedbackStatusTint(t.status)} dot>
                        {label(t.status)}
                      </Pill>
                    </span>
                    {t.summary && (
                      <span className="row-summary">{t.summary}</span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Meetings</h2>
            <Link to="/meetings" className="section-link">
              Timeline →
            </Link>
          </div>
          <div className="row-list">
            {meets.map((m, i) => (
              <Link
                key={m.id}
                to={noteHref(m.path)}
                className="card card-hover row fade-up"
                style={staggerStyle(i)}
              >
                <span className="row-date">{fmtDateShort(m.heldOn)}</span>
                <span className="row-body">
                  <span className="row-title">{m.title}</span>
                  <span className="row-meta">
                    <Pill tint={meetingStatusTint(m.status)} dot>
                      {label(m.status)}
                    </Pill>
                    {m.series && <Pill tint="stone">{m.series}</Pill>}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ n, cls, label }: { n: number; cls: string; label: string }) {
  return (
    <div className="stat">
      <span className={`stat-num ${cls}`}>{n}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
