/**
 * ArcTasks — the task layer of an arc. Rendered on a `work` note's Detail page
 * (below the body). Sources the arc's tasks by the `arc` metadata mirror (works
 * identically in demo + live — no link-walking), hides done / dropped, and
 * renders each as a calm pickup-able row. A per-row "Done" closes the task
 * (logging a line onto the arc first), and an inline "+ Add task" form mints a
 * new one under the arc.
 *
 * The arc board (Work) deliberately never lists tasks — `task` is a SIBLING tag
 * of `work` — so this is the one place the layer surfaces against its arc.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Note } from "@openparachute/surface-client";
import { addNoteLinks, createNote, isDemo, queryNotes, updateNote } from "../data/vault";
import { reposOf, toTask } from "../data/model";
import { signedInHandle } from "../lib/identity";
import { Pill } from "./ui";
import {
  priorityTint,
  taskStatusTint,
  type Task,
} from "../data/schema";
import {
  isClaimActive,
  label,
  noteHref,
  slugify,
  staggerStyle,
  todayISO,
} from "../lib/format";

// done / dropped tasks are settled — they don't belong in the live list.
const HIDDEN_STATUSES = new Set(["done", "dropped"]);

/** Tasks visible on an arc, hiding the settled ones, freshest priority first. */
function visibleTasks(notes: Note[]): Task[] {
  return notes
    .map(toTask)
    .filter((t) => !HIDDEN_STATUSES.has(t.status ?? "todo"));
}

/**
 * One task row — shared by the arc Detail list and Home's pickup lane. The
 * goal is the row title (links to the task note); a meta line of pills; the
 * next action always shown (it's the point); and a collapsed <details>
 * disclosure for the definition-of-done + code paths.
 *
 * `trailing` lets Home append a faint "in {arc}" link without ArcTasks owning
 * that context. `action` slots the Done button on the arc page.
 */
export function TaskRow({
  task,
  i = 0,
  action,
  trailing,
}: {
  task: Task;
  i?: number;
  action?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const claimed = isClaimActive(task.claimExpires);
  const hasDetails =
    !!task.definitionOfDone || (task.codePaths?.length ?? 0) > 0;
  return (
    <div className="card task-row fade-up" style={staggerStyle(i)}>
      <div className="task-row-main">
        <div className="task-row-head">
          <Link to={noteHref(task.path)} className="task-row-title">
            {task.goal ?? task.title}
          </Link>
          {action}
        </div>

        <div className="task-row-meta">
          {task.status && (
            <Pill tint={taskStatusTint(task.status)}>{label(task.status)}</Pill>
          )}
          {task.priority && (
            <Pill tint={priorityTint(task.priority)}>{label(task.priority)}</Pill>
          )}
          {task.ready && (
            <Pill tint="forest" dot>
              Ready
            </Pill>
          )}
          {claimed && (
            <>
              <Pill tint="sky">claimed</Pill>
              {task.claimedBy && (
                <span className="task-claimed-by">{task.claimedBy}</span>
              )}
            </>
          )}
          {trailing}
        </div>

        {task.nextAction && (
          <p className="task-next-action">{task.nextAction}</p>
        )}

        {hasDetails && (
          <details className="task-details">
            <summary>Done-when + code paths</summary>
            <div className="task-details-body">
              {task.definitionOfDone && (
                <p className="task-dod">
                  <span className="task-dod-label">Done when:</span>{" "}
                  {task.definitionOfDone}
                </p>
              )}
              {(task.codePaths?.length ?? 0) > 0 && (
                <div className="task-code-paths">
                  {task.codePaths!.map((p) => (
                    <span key={p} className="task-code-chip mono">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export function ArcTasks({
  arcPath,
  arcNote,
}: {
  arcPath: string;
  arcNote: Note;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // One Done at a time across the whole panel — a global gate, not per-id, so
  // two Done clicks can't race the arc-content append concurrently.
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  // Bump to re-pull after a write (Done / Add).
  const [refreshKey, setRefreshKey] = useState(0);
  // The latest arc body. `arcNote.content` is frozen at page load, so we keep a
  // mutable copy and append each Done's log line to *this* — otherwise a second
  // Done in the same visit would build on the stale prop and its force-write
  // would clobber the first Done's arc-log line. Re-seeded if the prop changes
  // (navigating to a different arc).
  const arcContentRef = useRef(arcNote.content ?? "");
  useEffect(() => {
    arcContentRef.current = arcNote.content ?? "";
  }, [arcNote.content]);

  useEffect(() => {
    // `loading` is seeded true and only flipped false once a fetch settles —
    // re-fetches (after a Done / Add) keep the current rows on screen rather
    // than flashing a loader, and we avoid a synchronous setState in the
    // effect body (react-hooks/set-state-in-effect).
    let alive = true;
    queryNotes({
      tag: "task",
      metadata: JSON.stringify({ arc: { eq: arcPath } }),
      include_metadata: "true",
      limit: "200",
    })
      .then((notes) => {
        if (alive) {
          setTasks(visibleTasks(notes));
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive)
          setError(e instanceof Error ? e.message : "Could not load tasks.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [arcPath, refreshKey]);

  const openCount = tasks.length;

  /**
   * Mark a task done. LOG-LINE-FIRST: append a completion line to the ARC body
   * before flipping the task status, so a failed second write leaves the task
   * open (recoverable) rather than silently closed-but-unlogged.
   *
   * Builds on `arcContentRef`, not the frozen `arcNote.content` prop, and only
   * advances the ref AFTER the arc write succeeds — so a sequence of Dones in
   * one visit accumulates every log line instead of the later one clobbering
   * the earlier. The global `busy` gate prevents two writes overlapping.
   */
  async function markDone(task: Task) {
    if (busy) return;
    setBusy(true);
    setError(null);
    // Optimistic: drop it from the live list.
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    try {
      const line = `\n- [done ${todayISO()}] ${task.goal ?? task.title}`;
      const nextContent = arcContentRef.current + line;
      await updateNote(arcPath, {
        content: nextContent,
        force: true,
      });
      // Arc write landed — advance the ref so the next Done builds on this.
      arcContentRef.current = nextContent;
      await updateNote(task.path, {
        metadata: { status: "done" },
        force: true,
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not close that task.",
      );
      // Roll the row back in.
      setRefreshKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="arc-tasks">
      <div className="section-head arc-tasks-head">
        <h2 className="arc-tasks-title">Tasks</h2>
        <span className="muted" style={{ fontSize: "0.85rem" }}>
          {openCount} open
        </span>
      </div>

      {error && <p className="task-error" role="alert">{error}</p>}

      {loading ? (
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Loading tasks…
        </p>
      ) : tasks.length === 0 ? (
        <p className="calm-empty" style={{ fontSize: "0.95rem" }}>
          No open tasks under this arc yet.
        </p>
      ) : (
        <div className="task-list">
          {tasks.map((t, i) => (
            <TaskRow
              key={t.id}
              task={t}
              i={i}
              action={
                <button
                  type="button"
                  className="btn btn-soft task-done-btn"
                  disabled={busy}
                  onClick={() => void markDone(t)}
                >
                  Done
                </button>
              }
            />
          ))}
        </div>
      )}

      {adding ? (
        <AddTaskForm
          arcPath={arcPath}
          arcNote={arcNote}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : (
        <button
          type="button"
          className="btn btn-ghost arc-add-task"
          onClick={() => setAdding(true)}
        >
          + Add task
        </button>
      )}
    </section>
  );
}

/**
 * Inline add-task form (no modal lib — mirrors the Weave / Add* createNote
 * pattern). Mints a `task` at Tasks/<arc-tail>-<goal-slug>, carrying the arc's
 * repo tags, the `arc` mirror, and a part_of link back to the arc.
 */
function AddTaskForm({
  arcPath,
  arcNote,
  onCancel,
  onCreated,
}: {
  arcPath: string;
  arcNote: Note;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const demo = isDemo();
  const [goal, setGoal] = useState("");
  const [dod, setDod] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [codePaths, setCodePaths] = useState("");
  const [priority, setPriority] = useState("next");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The arc's repo tags (repo/*) carry onto the task; the first is "primary".
  const repoTags = (arcNote.tags ?? [])
    .map((t) => t.replace(/^#/, ""))
    .filter((t) => t.startsWith("repo/"));
  const primaryRepo = reposOf(arcNote)[0] ?? "";
  const arcTail = arcPath.split("/").pop() ?? arcPath;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) {
      setError("Give the task a goal.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const codePathsArr = codePaths
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const path = `Tasks/${slugify(arcTail)}-${slugify(goal)}`;
      const created = await createNote({
        path,
        tags: ["task", ...repoTags],
        metadata: {
          goal: goal.trim(),
          definition_of_done: dod.trim(),
          next_action: nextAction.trim(),
          code_paths: codePathsArr,
          status: "todo",
          priority,
          ready,
          arc: arcPath,
          repo: primaryRepo,
          claimed_by: "",
          claim_expires: "",
          // App-layer attribution (no native author column yet).
          author: signedInHandle() ?? "",
        },
        content: `# ${goal.trim()}\n\n## Goal\n${goal.trim()}\n## Definition of done\n${dod.trim()}\n## Next action\n${nextAction.trim()}\n`,
      });
      try {
        await addNoteLinks(created.id, [
          { target: arcPath, relationship: "part_of" },
        ]);
      } catch {
        // Non-fatal: the `arc` mirror already sources the task; the link is a
        // nicety the weave can also propose.
      }
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the task.",
      );
      setBusy(false);
    }
  }

  return (
    <form className="add-task-form card card-pad" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="at-goal">Goal</label>
        <input
          id="at-goal"
          type="text"
          value={goal}
          placeholder="What does picking this up accomplish?"
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="at-next">Next action</label>
        <input
          id="at-next"
          type="text"
          value={nextAction}
          placeholder="The single concrete first step"
          onChange={(e) => setNextAction(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="at-dod">Definition of done</label>
        <input
          id="at-dod"
          type="text"
          value={dod}
          placeholder="Done when…"
          onChange={(e) => setDod(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="at-paths">Code paths</label>
        <input
          id="at-paths"
          type="text"
          value={codePaths}
          placeholder="comma-separated, e.g. src/views/Work.tsx, src/lib/format.ts"
          onChange={(e) => setCodePaths(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="at-priority">Priority</label>
          <select
            id="at-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="now">Now</option>
            <option value="next">Next</option>
            <option value="later">Later</option>
          </select>
        </div>
        <div className="field add-task-ready">
          {/* Caption is a plain span — the wrapping <label> below owns the
              input, so a second htmlFor label would double-associate it. */}
          <span className="field-caption">Ready</span>
          <label className="ready-check">
            <input
              id="at-ready"
              type="checkbox"
              checked={ready}
              onChange={(e) => setReady(e.target.checked)}
            />
            <span>An agent can pick this up now</span>
          </label>
        </div>
      </div>

      <div className="modal-actions">
        {error && <span className="modal-error">{error}</span>}
        {demo && !error && (
          <span className="modal-error" style={{ color: "var(--fg-dim)" }}>
            Demo mode — connect to the vault to save real tasks.
          </span>
        )}
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={busy || demo}>
          {busy ? "Saving…" : "Add task"}
        </button>
      </div>
    </form>
  );
}
