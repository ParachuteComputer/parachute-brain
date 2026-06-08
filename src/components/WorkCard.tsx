/**
 * The work card — title, priority pill, kind, assignee avatar, and the
 * elegant repo chips that make the cross-repo span legible at a glance.
 */
import { Link } from "react-router-dom";
import { Avatar, Pill, RepoChip } from "./ui";
import {
  kindTint,
  priorityTint,
  workStatusTint,
  type Work,
} from "../data/schema";
import { label, noteHref } from "../lib/format";

export function WorkCard({
  work,
  activeRepo,
  onRepoClick,
  showStatus = false,
}: {
  work: Work;
  activeRepo?: string | null;
  onRepoClick?: (repo: string) => void;
  showStatus?: boolean;
}) {
  return (
    <Link to={noteHref(work.path)} className="card card-hover work-card">
      <div className="work-card-title">{work.title}</div>
      <div className="work-card-meta">
        {work.needsDecision && (
          <Pill tint="terracotta" dot>
            Needs decision
          </Pill>
        )}
        {work.priority && (
          <Pill tint={priorityTint(work.priority)}>{label(work.priority)}</Pill>
        )}
        {work.kind && (
          <Pill tint={kindTint(work.kind)} dot>
            {label(work.kind)}
          </Pill>
        )}
        {showStatus && work.status && (
          <Pill tint={workStatusTint(work.status)}>{label(work.status)}</Pill>
        )}
        {work.assignee && (
          <span className="assignee">
            <Avatar name={work.assignee} />
            {work.assignee}
          </span>
        )}
      </div>
      {work.repos.length > 0 && (
        <div className="work-card-repos">
          {work.repos.map((r) => (
            <RepoChip
              key={r}
              repo={r}
              active={activeRepo === r}
              onClick={onRepoClick}
            />
          ))}
        </div>
      )}
    </Link>
  );
}
