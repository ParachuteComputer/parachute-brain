/**
 * Feedback — themes grouped by status, sorted by severity then by how many
 * raw captures feed them. Category + severity pills. Click a theme → detail
 * showing its raw captures + the work it drives.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toFeedbackCapture, toFeedbackTheme } from "../data/model";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { AddFeedbackModal } from "../components/AddFeedbackModal";
import {
  FEEDBACK_STATUSES,
  categoryTint,
  feedbackStatusTint,
  priorityTint,
  type FeedbackStatus,
} from "../data/schema";
import { label, noteHref, staggerStyle } from "../lib/format";

const SEV_RANK: Record<string, number> = { p0: 0, p1: 1, p2: 2 };

export function Feedback() {
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const themes = useNotes({
    tag: "feedback-theme",
    include_metadata: "true",
    limit: "500",
  });
  const captures = useNotes({
    tag: "capture/feedback",
    include_metadata: "true",
    limit: "500",
  });

  const capturesByTheme = useMemo(() => {
    const map = new Map<string, number>();
    (captures.data ?? []).map(toFeedbackCapture).forEach((c) => {
      if (c.theme) map.set(c.theme, (map.get(c.theme) ?? 0) + 1);
    });
    return map;
  }, [captures.data]);

  const grouped = useMemo(() => {
    const all = (themes.data ?? []).map(toFeedbackTheme);
    const slug = (path: string) => path.split("/").pop() ?? path;
    const withCounts = all.map((t) => ({
      ...t,
      captureCount: t.captureCount ?? capturesByTheme.get(slug(t.path)) ?? 0,
    }));
    const byStatus = new Map<FeedbackStatus, typeof withCounts>();
    for (const s of FEEDBACK_STATUSES) byStatus.set(s, []);
    for (const t of withCounts) {
      const s = (t.status ?? "open") as FeedbackStatus;
      (byStatus.get(s) ?? byStatus.get("open")!).push(t);
    }
    for (const arr of byStatus.values()) {
      arr.sort((a, b) => {
        const sev =
          (SEV_RANK[a.severity ?? "p2"] ?? 2) -
          (SEV_RANK[b.severity ?? "p2"] ?? 2);
        if (sev !== 0) return sev;
        return (b.captureCount ?? 0) - (a.captureCount ?? 0);
      });
    }
    return byStatus;
  }, [themes.data, capturesByTheme]);

  if (themes.loading || captures.loading) return <Loader />;
  if (themes.error) return <ErrorBox message={themes.error} />;

  const activeStatuses = FEEDBACK_STATUSES.filter(
    (s) => (grouped.get(s)?.length ?? 0) > 0,
  );

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="What we're hearing"
        title="Feedback"
        lead="Themes distilled from the raw captures, grouped by where we are with them — most urgent first."
      />

      <div className="page-actions">
        <button type="button" className="btn" onClick={() => setAdding(true)}>
          + Add feedback
        </button>
      </div>
      <AddFeedbackModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(p) => {
          setAdding(false);
          navigate(noteHref(p));
        }}
      />

      {activeStatuses.length === 0 ? (
        <Empty title="No feedback themes yet" />
      ) : (
        activeStatuses.map((status) => {
          const items = grouped.get(status) ?? [];
          return (
            <section key={status} className="section">
              <div className="section-head">
                <h2 className="section-title">{label(status)}</h2>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {items.length} {items.length === 1 ? "theme" : "themes"}
                </span>
              </div>
              <div className="grid grid-auto">
                {items.map((t, i) => (
                  <Link
                    key={t.id}
                    to={noteHref(t.path)}
                    className="card card-hover card-pad fade-up"
                    style={staggerStyle(i)}
                  >
                    <div className="work-card-meta">
                      {t.severity && (
                        <Pill tint={priorityTint(t.severity)}>
                          {t.severity.toUpperCase()}
                        </Pill>
                      )}
                      {t.category && (
                        <Pill tint={categoryTint(t.category)} dot>
                          {label(t.category)}
                        </Pill>
                      )}
                      <Pill tint={feedbackStatusTint(t.status)}>
                        {label(t.status)}
                      </Pill>
                    </div>
                    <div className="row-title" style={{ marginTop: 6 }}>
                      {t.title}
                    </div>
                    {t.summary && (
                      <p className="row-summary" style={{ margin: "6px 0 10px" }}>
                        {t.summary}
                      </p>
                    )}
                    <span className="dim mono" style={{ fontSize: "0.72rem" }}>
                      {t.captureCount ?? 0}{" "}
                      {t.captureCount === 1 ? "capture" : "captures"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
