/**
 * Home — the morning brief. An ACTIVE read, top to bottom:
 *
 *   1. Waiting on you   — the decisions waiting on a human call (needs_decision
 *                         work + pending Weave proposals). The point of the page.
 *   2. Focus            — what to actually do next, computed client-side from the
 *                         board (in-progress → now → next; blocked de-emphasized).
 *   3. What moved        — the latest daily summary, demoted to the narrative "why".
 *
 * The founder opens this every morning; it answers "what needs me, and what's
 * next" before anything else.
 */
import { Link } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toProposal, toTask, toWork } from "../data/model";
import { Loader, ErrorBox, Pill, RepoChip } from "../components/ui";
import { TaskRow } from "../components/ArcTasks";
import { PageHeader } from "../components/PageHeader";
import { NoteBody } from "../components/NoteBody";
import {
  priorityRank,
  priorityTint,
  workStatusTint,
  type Work,
} from "../data/schema";
import {
  isClaimActive,
  label,
  fmtDate,
  noteHref,
  staggerStyle,
  todayISO,
} from "../lib/format";

// How many pickup-able tasks to show on the morning page before "N more".
const PICKUP_CAP = 8;

// Work that's genuinely "in flight or queued" — the Focus pool.
const FOCUS_EXCLUDE = new Set(["shipped", "dropped"]);

/**
 * Days until / since an ISO target date (UTC-midnight anchored). Returns null
 * for anything that doesn't parse — many `target`s are free text ("when Aaron
 * says"), and those simply get no due-chip rather than a wrong one.
 */
function daysFromToday(target?: string): number | null {
  if (!target) return null;
  const iso = target.trim();
  // Only treat strict YYYY-MM-DD (optionally with a time) as a real date.
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const t = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso).getTime();
  if (Number.isNaN(t)) return null;
  const ref = todayISO();
  const now = new Date(ref + "T00:00:00Z").getTime();
  return Math.round((t - now) / 86_400_000);
}

function DueChip({ target }: { target?: string }) {
  const d = daysFromToday(target);
  if (d === null) return null;
  if (d === 0) return <Pill tint="amber">due today</Pill>;
  if (d > 0)
    return (
      <Pill tint={d <= 3 ? "amber" : "stone"}>
        due in {d} {d === 1 ? "day" : "days"}
      </Pill>
    );
  const ago = -d;
  return (
    <Pill tint="terracotta">
      {ago} {ago === 1 ? "day" : "days"} ago
    </Pill>
  );
}

export function Today() {
  const work = useNotes({ tag: "work", include_metadata: "true", limit: "500" });
  const proposals = useNotes({
    tag: "proposal",
    include_metadata: "true",
    limit: "200",
  });
  // The pickup set: ready tasks still in flight (todo / doing). Claimed rows
  // are dropped client-side (a future claim_expires = someone holds it).
  const pickup = useNotes({
    tag: "task",
    metadata: JSON.stringify({
      ready: { eq: true },
      status: { in: ["todo", "doing"] },
    }),
    include_metadata: "true",
    limit: "200",
  });
  const daily = useNotes({ path_prefix: `summaries/daily/${todayISO()}` });

  if (work.loading || proposals.loading || pickup.loading) return <Loader />;

  const err = work.error || proposals.error || pickup.error;
  if (err) return <ErrorBox message={err} />;

  const works = (work.data ?? []).map(toWork);

  // 1 — Waiting on you ------------------------------------------------------
  const needsDecision = works.filter((w) => w.needsDecision);
  const pendingProposals = (proposals.data ?? [])
    .map(toProposal)
    .filter((p) => p.status === "pending");
  const waitingCount = needsDecision.length + pendingProposals.length;

  // 2 — Focus (what's next), computed client-side from the board -----------
  // in-progress first, then by priority (now → next → later), blocked sinks but
  // stays visible (greyed). shipped/dropped are out entirely.
  const focusPool = works.filter(
    (w) => !FOCUS_EXCLUDE.has(w.status ?? "") && !w.needsDecision,
  );
  const focus = [...focusPool]
    .sort((a, b) => focusScore(a) - focusScore(b))
    .slice(0, 6);

  // 3 — Ready to pick up ----------------------------------------------------
  // ready + todo/doing tasks, minus any with a LIVE soft claim, ranked
  // now → next → later, capped. "What can an agent grab right now."
  const pickupAll = (pickup.data ?? [])
    .map(toTask)
    .filter((t) => !isClaimActive(t.claimExpires))
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
  const pickupShown = pickupAll.slice(0, PICKUP_CAP);
  const pickupMore = pickupAll.length - pickupShown.length;

  const dailyNote = daily.data?.[0];

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow={`Morning brief · ${fmtDate(todayISO())}`}
        title="Good morning"
        lead="What needs your call, what's next, and what moved overnight — top to bottom."
      />

      {/* 1 — Waiting on you ------------------------------------------------ */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Waiting on you</h2>
          {waitingCount > 0 && (
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {waitingCount} {waitingCount === 1 ? "call" : "calls"}
            </span>
          )}
        </div>

        {waitingCount === 0 ? (
          <div className="calm-empty fade-up">
            Nothing needs your call right now.
          </div>
        ) : (
          <div className="waiting-list">
            {needsDecision.map((w, i) => (
              <DecisionCard key={w.id} work={w} i={i} />
            ))}
            {pendingProposals.map((p, i) => (
              <Link
                key={p.id}
                to="/weave"
                className="card card-hover decide-card decide-card-proposal fade-up"
                style={staggerStyle(needsDecision.length + i)}
              >
                <div className="decide-head">
                  <Pill tint="sky" dot>
                    Proposal
                  </Pill>
                  <span className="decide-arc">{p.entityName ?? p.title}</span>
                </div>
                {p.evidence && <p className="decide-call">{p.evidence}</p>}
                <span className="decide-link">Review in Weave →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 2 — Focus -------------------------------------------------------- */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Focus — what's next</h2>
          <Link to="/work" className="section-link">
            All work →
          </Link>
        </div>

        {focus.length === 0 ? (
          <div className="calm-empty fade-up">
            Nothing queued. A clear runway.
          </div>
        ) : (
          <div className="row-list">
            {focus.map((w, i) => {
              const dim = w.status === "blocked";
              return (
                <Link
                  key={w.id}
                  to={noteHref(w.path)}
                  className={`card card-hover row focus-row fade-up${
                    dim ? " focus-row-dim" : ""
                  }`}
                  style={staggerStyle(i)}
                >
                  <span className="row-body">
                    <span className="row-title">{w.title}</span>
                    <span className="row-meta">
                      {w.status && (
                        <Pill tint={workStatusTint(w.status)}>
                          {label(w.status)}
                        </Pill>
                      )}
                      {w.priority && (
                        <Pill tint={priorityTint(w.priority)}>
                          {label(w.priority)}
                        </Pill>
                      )}
                      <DueChip target={w.target} />
                    </span>
                    {w.repos.length > 0 && (
                      <span className="work-card-repos">
                        {w.repos.map((r) => (
                          <RepoChip key={r} repo={r} />
                        ))}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 3 — Ready to pick up --------------------------------------------- */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Ready to pick up</h2>
          {pickupAll.length > 0 && (
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {pickupAll.length} ready
            </span>
          )}
        </div>

        {pickupShown.length === 0 ? (
          <div className="calm-empty fade-up">No tasks ready to pick up.</div>
        ) : (
          <div className="task-list">
            {pickupShown.map((t, i) => {
              const arcTail = t.arc ? t.arc.split("/").pop() ?? t.arc : null;
              return (
                <TaskRow
                  key={t.id}
                  task={t}
                  i={i}
                  trailing={
                    arcTail && t.arc ? (
                      <Link
                        to={noteHref(t.arc)}
                        className="task-arc-link"
                        title={t.arc}
                      >
                        in {arcTail}
                      </Link>
                    ) : null
                  }
                />
              );
            })}
            {pickupMore > 0 && (
              <Link to="/work" className="section-link task-more-link">
                {pickupMore} more →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* 4 — What moved --------------------------------------------------- */}
      {dailyNote && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">What moved</h2>
          </div>
          <div className="daily-banner fade-up">
            <NoteBody note={dailyNote} />
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Focus sort key (lower = higher up). in-progress / in-review share the top
 * band; blocked sinks to the bottom but isn't dropped; everything else sits in
 * between. Within a band, the now/next/later horizon refines the order.
 */
function focusScore(w: Work): number {
  // status bucket — coarse band, then priority refines within it.
  let band: number;
  if (w.status === "in-progress" || w.status === "in-review") band = 0;
  else if (w.status === "blocked") band = 3;
  else band = 1;
  return band * 10 + priorityRankClamped(w.priority);
}

// priorityRank returns 99 for unknowns; clamp so it doesn't dominate the band.
function priorityRankClamped(p?: string): number {
  const r = priorityRank(p);
  return r > 3 ? 3 : r;
}

function DecisionCard({ work, i }: { work: Work; i: number }) {
  return (
    <Link
      to={noteHref(work.path)}
      className="card card-hover decide-card fade-up"
      style={staggerStyle(i)}
    >
      <div className="decide-head">
        <Pill tint="terracotta" dot>
          Decision
        </Pill>
        <span className="decide-arc">{work.title}</span>
      </div>
      {work.theCall ? (
        <p className="decide-call">{work.theCall}</p>
      ) : work.summary ? (
        <p className="decide-call decide-call-muted">{work.summary}</p>
      ) : null}
      {work.repos.length > 0 && (
        <div className="work-card-repos" style={{ marginTop: 4 }}>
          {work.repos.map((r) => (
            <RepoChip key={r} repo={r} />
          ))}
        </div>
      )}
      <span className="decide-link">Open the arc →</span>
    </Link>
  );
}
