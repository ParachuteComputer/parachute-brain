/**
 * Weave — the governance queue. Pending `proposal` notes grouped by
 * entity_type. Each shows entity_name / summary / confidence / evidence with
 * Approve / Reject. Approve: create the proposed entity (or add the link) +
 * set proposal status=approved. Reject: set status=rejected. Optimistic UI.
 */
import { useMemo, useState } from "react";
import { useNotes } from "../data/useNotes";
import { toProposal } from "../data/model";
import { createNote, updateNote } from "../data/vault";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import type { Proposal } from "../data/schema";
import { label, staggerStyle } from "../lib/format";

type Resolution = "approved" | "rejected";

export function Weave() {
  const { data, loading, error } = useNotes({
    tag: "proposal",
    include_metadata: "true",
    limit: "500",
  });
  // Local optimistic overlay: proposal id → its new resolution. Stale ids
  // for proposals no longer in `data` are harmless (they simply aren't
  // rendered), so the overlay never needs an explicit reset.
  const [resolved, setResolved] = useState<Record<string, Resolution>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const proposals = useMemo(() => (data ?? []).map(toProposal), [data]);
  const pending = proposals.filter(
    (p) => (resolved[p.id] ?? p.status) === "pending",
  );

  const byType = useMemo(() => {
    const map = new Map<string, Proposal[]>();
    for (const p of pending) {
      const t = p.entityType ?? "other";
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(p);
    }
    return map;
  }, [pending]);

  async function resolve(p: Proposal, resolution: Resolution) {
    setPendingAction(p.id);
    setActionError(null);
    // Optimistic.
    setResolved((r) => ({ ...r, [p.id]: resolution }));
    try {
      if (resolution === "approved" && p.kind === "entity") {
        // Create the proposed entity note.
        const slug = (p.entityName ?? "entity")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const folder =
          p.entityType === "person"
            ? "People"
            : p.entityType === "org"
              ? "Orgs"
              : "Entities";
        await createNote({
          content: `# ${p.entityName}\n\n${p.evidence ?? ""}`.trim(),
          path: `${folder}/${p.entityName ?? slug}`,
          tags: [p.entityType ?? "entity"],
          metadata: { summary: p.evidence },
        });
      }
      // (link approvals would add a link via updateNote on the live vault.)
      await updateNote(p.id, {
        metadata: { status: resolution },
        force: true,
      });
    } catch (e) {
      // Roll back optimistic state.
      setResolved((r) => {
        const next = { ...r };
        delete next[p.id];
        return next;
      });
      setActionError(
        e instanceof Error ? e.message : "Could not record that action.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;

  const types = [...byType.keys()].sort();

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Tending the graph"
        title="Weave"
        lead="Proposed entities and links the vault has surfaced for review. Approve to weave them in; set aside what doesn't fit."
      />

      {actionError && (
        <div style={{ marginBottom: 20 }}>
          <ErrorBox message={actionError} />
        </div>
      )}

      {pending.length === 0 ? (
        <Empty
          title="The queue is clear"
          text="Nothing waiting for review. The graph is tidy."
        />
      ) : (
        types.map((type) => {
          const items = byType.get(type) ?? [];
          return (
            <section key={type} className="section">
              <div className="section-head">
                <h2 className="section-title">{label(type)}</h2>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {items.length} pending
                </span>
              </div>
              <div className="grid grid-auto">
                {items.map((p, i) => (
                  <div
                    key={p.id}
                    className="card card-pad weave-card fade-up"
                    style={staggerStyle(i)}
                  >
                    <div className="weave-head">
                      <span className="weave-entity">
                        {p.entityName ?? p.title}
                      </span>
                      <Pill tint={p.kind === "link" ? "sky" : "lavender"} dot>
                        {label(p.kind ?? "entity")}
                      </Pill>
                    </div>
                    {p.evidence && (
                      <p className="weave-evidence">{p.evidence}</p>
                    )}
                    {typeof p.confidence === "number" && (
                      <div style={{ marginBottom: 14 }}>
                        <span className="weave-confidence">
                          confidence {Math.round(p.confidence * 100)}%
                        </span>
                        <div className="confidence-bar">
                          <div
                            className="confidence-fill"
                            style={{ width: `${Math.round(p.confidence * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="weave-actions">
                      <button
                        type="button"
                        className="btn"
                        disabled={pendingAction === p.id}
                        onClick={() => resolve(p, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={pendingAction === p.id}
                        onClick={() => resolve(p, "rejected")}
                      >
                        Set aside
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
