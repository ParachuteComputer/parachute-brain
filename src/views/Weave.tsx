/**
 * Weave — the governance queue. Pending `proposal` notes grouped by
 * entity_type. Each shows entity_name / summary / confidence / evidence with
 * Approve / Reject. Approve: create the proposed entity (or add the link) +
 * set proposal status=approved. Reject: set status=rejected. Optimistic UI.
 */
import { useMemo, useState } from "react";
import { useNotes } from "../data/useNotes";
import { toProposal } from "../data/model";
import { addNoteLinks, createNote, updateNote } from "../data/vault";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import type { Proposal } from "../data/schema";
import { label, slugify, staggerStyle, todayISO } from "../lib/format";

type Resolution = "approved" | "rejected";

/**
 * First non-blank, non-heading line of a note's markdown body — the last-resort
 * summary fallback when a proposal carries neither entity_summary nor evidence.
 */
function firstMeaningfulLine(content?: string): string | undefined {
  if (!content) return undefined;
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    return line.replace(/^>\s*/, "");
  }
  return undefined;
}

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
  // Proposals we refused to apply because no non-empty summary could be
  // derived — surfaced inline so a human knows to regenerate the proposal.
  const [missingSummary, setMissingSummary] = useState<Record<string, boolean>>(
    {},
  );

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
    setMissingSummary((s) => {
      if (!s[p.id]) return s;
      const next = { ...s };
      delete next[p.id];
      return next;
    });
    // Optimistic.
    setResolved((r) => ({ ...r, [p.id]: resolution }));
    try {
      if (resolution === "approved" && p.kind === "entity") {
        // Create the proposed entity at its conventional home with explicit,
        // honest metadata. NOTE: the vault fills FIRST-enum defaults for any
        // absent enum field (a person once landed "core-team / founder") —
        // blank beats wrong, so unknowns are set to "" deliberately and show
        // up as needs-triage rather than silently miscategorized.
        const name = (p.entityName ?? "entity").trim();
        // Display-name paths (People/Orgs) keep spaces but must not nest:
        // a slash in a name would silently create sub-paths.
        const safeName = name.replace(/[\\/]+/g, "-");
        const slug = slugify(name, "entity");
        const m = (p.note.metadata ?? {}) as Record<string, unknown>;
        const entitySummary =
          typeof m.entity_summary === "string" && m.entity_summary
            ? m.entity_summary
            : undefined;
        // A note must never be minted with an empty summary. Fall back through
        // entity_summary → evidence → the proposal's own first meaningful line
        // (skipping headings + blanks) → the entity name. If even that is
        // empty, refuse to write: surface a "regenerate" state and leave the
        // proposal pending (see the guard below).
        const resolvedSummary = (
          entitySummary ||
          p.evidence ||
          firstMeaningfulLine(p.note.content) ||
          name
        ).trim();
        if (!resolvedSummary) {
          setResolved((r) => {
            const next = { ...r };
            delete next[p.id];
            return next;
          });
          setMissingSummary((s) => ({ ...s, [p.id]: true }));
          setPendingAction(null);
          return;
        }
        // Dated paths: prefer a YYYY-MM-DD from the evidence (usually the
        // source meeting's path), else today.
        const evDate =
          (p.evidence ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? todayISO();
        let path = `Entities/${safeName}`;
        let metadata: Record<string, unknown> = {
          summary: resolvedSummary,
        };
        // Tags beyond the entity-type tag (tasks also carry the arc's repo
        // tags) + an optional part_of link to wire the new note into the graph.
        let extraTags: string[] = [];
        let linkTarget: string | null = null;
        switch (p.entityType) {
          case "person":
            path = `People/${safeName}`;
            // "user" per the team philosophy: ideally everyone is a user.
            metadata = { ...metadata, relation: "user", role: "", handle: "" };
            break;
          case "org":
            path = `Orgs/${safeName}`;
            metadata = { ...metadata, kind: "", affiliation: "" };
            break;
          case "work":
            path = `Work/${slug}`;
            metadata = {
              ...metadata,
              kind: "task",
              status: "inbox",
              priority: "",
              assignee: "",
              target: "",
              gh_links: [],
            };
            break;
          case "decision":
            path = `Decisions/${evDate}-${slug}`;
            // Approving a "this was decided" proposal accepts the record.
            metadata = {
              ...metadata,
              status: "accepted",
              scope: "",
              decided_on: evDate,
            };
            break;
          case "meeting":
            path = `Meetings/${evDate}-${slug}`;
            metadata = {
              ...metadata,
              series: "ad-hoc",
              held_on: evDate,
              status: "held",
            };
            break;
          case "feedback-theme":
            path = `Feedback/themes/${slug}`;
            metadata = {
              ...metadata,
              status: "open",
              category: "",
              severity: "",
            };
            break;
          case "task": {
            // A task minted from a meeting → its arc. The arc path comes from
            // the proposal's metadata (arc_path); derive the repo from it, and
            // hang the task under the arc with a part_of link (skipped if the
            // arc is blank — the task still stands alone, just unparented).
            const arcPath =
              typeof m.arc_path === "string" ? m.arc_path.trim() : "";
            const arcTail = arcPath ? arcPath.split("/").pop() ?? arcPath : "";
            const arcRepo =
              typeof m.repo === "string" && m.repo
                ? m.repo
                : arcTail.match(/parachute[-.][a-z]+/)?.[0] ?? "";
            path = `Tasks/${arcTail ? slugify(arcTail) + "-" : ""}${slug}`;
            metadata = {
              goal: name,
              summary: resolvedSummary,
              definition_of_done: entitySummary ?? resolvedSummary,
              next_action: "",
              code_paths: [],
              ready: false,
              status: "todo",
              priority: "next",
              arc: arcPath,
              repo: arcRepo,
              claimed_by: "",
              claim_expires: "",
            };
            if (arcRepo) extraTags = [`repo/${arcRepo}`];
            if (arcPath) linkTarget = arcPath;
            break;
          }
        }
        const created = await createNote({
          content: [
            `# ${name}`,
            entitySummary ?? resolvedSummary,
            p.evidence ? `> ${p.evidence}` : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
          path,
          tags: [p.entityType ?? "entity", ...extraTags],
          metadata,
        });
        if (linkTarget) {
          try {
            await addNoteLinks(created.id, [
              { target: linkTarget, relationship: "part_of" },
            ]);
          } catch {
            // Non-fatal: the `arc` metadata mirror already sources the task.
          }
        }
      }
      // Link approvals are still mark-only: applying the edge needs a
      // source_path on the proposal (a weave-prompt addition) before the
      // apply can act deterministically. Tracked in the vault.
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
                    {missingSummary[p.id] && (
                      <p className="weave-missing-summary" role="alert">
                        Proposal missing summary — regenerate.
                      </p>
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
