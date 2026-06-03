/**
 * Work — a calm kanban. Columns by status; cards carry priority, assignee,
 * and repo chips. Filters: repo (click a chip to scope), assignee, priority.
 */
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toWork } from "../data/model";
import { Loader, Empty, ErrorBox, RepoChip } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { WorkCard } from "../components/WorkCard";
import { REPOS, WORK_STATUSES, type Work as WorkT } from "../data/schema";
import { staggerStyle } from "../lib/format";

// Columns shown on the board (shipped/dropped folded to the right / hidden).
const COLUMNS = WORK_STATUSES.filter((s) => s !== "dropped");
const COLUMN_LABEL: Record<string, string> = {
  inbox: "Inbox",
  exploring: "Exploring",
  planned: "Planned",
  "in-progress": "In progress",
  blocked: "Blocked",
  "in-review": "In review",
  shipped: "Shipped",
};

const PRIORITY_RANK: Record<string, number> = { p0: 0, p1: 1, p2: 2 };

export function Work() {
  const { data, loading, error } = useNotes({
    tag: "work",
    include_metadata: "true",
    limit: "500",
  });
  const [params, setParams] = useSearchParams();
  const repo = params.get("repo");
  const assignee = params.get("assignee");
  const [prioritySort, setPrioritySort] = useState(false);

  const works = useMemo(() => (data ?? []).map(toWork), [data]);

  const assignees = useMemo(() => {
    const s = new Set<string>();
    works.forEach((w) => w.assignee && s.add(w.assignee));
    return [...s].sort();
  }, [works]);

  const filtered = useMemo(() => {
    let rows = works;
    if (repo) rows = rows.filter((w) => w.repos.includes(repo as never));
    if (assignee) rows = rows.filter((w) => w.assignee === assignee);
    return rows;
  }, [works, repo, assignee]);

  const byCol = useMemo(() => {
    const map = new Map<string, WorkT[]>();
    for (const col of COLUMNS) map.set(col, []);
    for (const w of filtered) {
      const col = w.status && map.has(w.status) ? w.status : "inbox";
      map.get(col)!.push(w);
    }
    if (prioritySort) {
      for (const arr of map.values())
        arr.sort(
          (a, b) =>
            (PRIORITY_RANK[a.priority ?? "p2"] ?? 2) -
            (PRIORITY_RANK[b.priority ?? "p2"] ?? 2),
        );
    }
    return map;
  }, [filtered, prioritySort]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;

  const activeCols = COLUMNS.filter((c) => (byCol.get(c)?.length ?? 0) > 0);

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="The work"
        title="What we're making"
        lead="Every piece of work, by where it is. The repo chips show the cross-repo span — click one to see everything touching it."
      />

      <div className="filterbar">
        <div className="filter-group">
          <span className="filter-label">Repo</span>
          {REPOS.map((r) => (
            <RepoChip
              key={r}
              repo={r}
              active={repo === r}
              onClick={(rr) => setParam("repo", repo === rr ? null : rr)}
            />
          ))}
        </div>
        <div className="filter-group">
          <span className="filter-label">Assignee</span>
          <select
            className="select"
            value={assignee ?? ""}
            onChange={(e) => setParam("assignee", e.target.value || null)}
          >
            <option value="">Everyone</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Sort</span>
          <button
            type="button"
            className={`repo-chip${prioritySort ? " active" : ""}`}
            onClick={() => setPrioritySort((s) => !s)}
          >
            By priority
          </button>
        </div>
        {(repo || assignee) && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "6px 12px", fontSize: "0.82rem" }}
            onClick={() => setParams({}, { replace: true })}
          >
            Clear filters
          </button>
        )}
        {repo && (
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            Showing everything touching{" "}
            <span className="mono">{repo}</span>
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty
          title="No work matches"
          text="Try clearing a filter to widen the view."
        />
      ) : (
        <div className="kanban">
          {activeCols.map((col) => {
            const items = byCol.get(col) ?? [];
            return (
              <div key={col} className="kanban-col">
                <div className="kanban-col-head">
                  <span className="kanban-col-title">
                    {COLUMN_LABEL[col] ?? col}
                  </span>
                  <span className="kanban-col-count">{items.length}</span>
                </div>
                <div className="kanban-col-rule" />
                {items.map((w, i) => (
                  <div key={w.id} className="fade-up" style={staggerStyle(i)}>
                    <WorkCard
                      work={w}
                      activeRepo={repo}
                      onRepoClick={(rr) =>
                        setParam("repo", repo === rr ? null : rr)
                      }
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
