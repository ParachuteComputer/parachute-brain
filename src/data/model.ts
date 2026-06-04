/**
 * Project raw vault `Note` records into the domain types in `schema.ts`.
 * One projector per entity type; each reads `note.metadata` defensively
 * (the wire shape is `Record<string, unknown>`).
 */
import type { Note } from "@openparachute/surface-client";
import type {
  Decision,
  DecisionScope,
  DecisionStatus,
  FeedbackCapture,
  FeedbackCategory,
  FeedbackStatus,
  FeedbackTheme,
  Meeting,
  MeetingSeries,
  MeetingStatus,
  Org,
  Person,
  Priority,
  Proposal,
  ProposalStatus,
  Relation,
  Repo,
  Strategy,
  StrategyKind,
  StrategyStatus,
  Work,
  WorkKind,
  WorkStatus,
} from "./schema";

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

const num = (v: unknown): number | undefined => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
    return Number(v);
  return undefined;
};

const strArr = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return undefined;
};

function meta(n: Note): Record<string, unknown> {
  return n.metadata ?? {};
}

/** Derive a human title from path tail or metadata title. */
export function titleOf(n: Note): string {
  const m = meta(n);
  const t = str(m.title) ?? str(m.name);
  if (t) return t;
  if (n.path) {
    const tail = n.path.split("/").pop() ?? n.path;
    return tail
      .replace(/\.md$/, "")
      .replace(/^\d{4}-\d{2}-\d{2}-/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return n.id;
}

function summaryOf(n: Note): string | undefined {
  const m = meta(n);
  return str(m.summary) ?? n.preview ?? undefined;
}

function base(n: Note) {
  return {
    note: n,
    id: n.id,
    path: n.path ?? n.id,
    title: titleOf(n),
    summary: summaryOf(n),
  };
}

export function reposOf(n: Note): Repo[] {
  return (n.tags ?? [])
    .map((t) => t.replace(/^#/, ""))
    .filter((t) => t.startsWith("repo/"))
    .map((t) => t.slice("repo/".length) as Repo);
}

export function toPerson(n: Note): Person {
  const m = meta(n);
  return {
    ...base(n),
    relation: str(m.relation) as Relation | undefined,
    role: str(m.role),
    handle: str(m.handle),
    contact: str(m.contact),
    aliases: strArr(m.aliases),
  };
}

export function toOrg(n: Note): Org {
  const m = meta(n);
  return { ...base(n), kind: str(m.kind), affiliation: str(m.affiliation) };
}

export function toWork(n: Note): Work {
  const m = meta(n);
  return {
    ...base(n),
    kind: str(m.kind) as WorkKind | undefined,
    status: str(m.status) as WorkStatus | undefined,
    priority: str(m.priority) as Priority | undefined,
    assignee: str(m.assignee),
    target: str(m.target),
    ghLinks: strArr(m.gh_links),
    repos: reposOf(n),
  };
}

export function toDecision(n: Note): Decision {
  const m = meta(n);
  return {
    ...base(n),
    status: str(m.status) as DecisionStatus | undefined,
    scope: str(m.scope) as DecisionScope | undefined,
    decidedOn: str(m.decided_on),
    supersedes: str(m.supersedes),
    supersededBy: str(m.superseded_by),
  };
}

export function toStrategy(n: Note): Strategy {
  const m = meta(n);
  return {
    ...base(n),
    kind: str(m.kind) as StrategyKind | undefined,
    status: str(m.status) as StrategyStatus | undefined,
    supersedes: str(m.supersedes),
  };
}

export function toMeeting(n: Note): Meeting {
  const m = meta(n);
  return {
    ...base(n),
    series: str(m.series) as MeetingSeries | undefined,
    heldOn: str(m.held_on),
    status: str(m.status) as MeetingStatus | undefined,
  };
}

export function toFeedbackTheme(n: Note): FeedbackTheme {
  const m = meta(n);
  return {
    ...base(n),
    status: str(m.status) as FeedbackStatus | undefined,
    category: str(m.category) as FeedbackCategory | undefined,
    severity: str(m.severity) as Priority | undefined,
    captureCount: num(m.capture_count),
  };
}

export function toFeedbackCapture(n: Note): FeedbackCapture {
  const m = meta(n);
  return {
    ...base(n),
    source: str(m.source),
    reporter: str(m.reporter),
    theme: str(m.theme),
  };
}

export function toProposal(n: Note): Proposal {
  const m = meta(n);
  return {
    ...base(n),
    status: str(m.status) as ProposalStatus | undefined,
    kind: str(m.kind) as "entity" | "link" | undefined,
    entityType: str(m.entity_type),
    entityName: str(m.entity_name),
    confidence: num(m.confidence),
    evidence: str(m.evidence),
  };
}
