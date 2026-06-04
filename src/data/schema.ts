/**
 * The vault schema this surface renders (vault = `default`).
 * Domain types + the enum vocabularies + the semantic-tint mapping.
 *
 * These mirror the seeded tag schemas. The raw wire shape is
 * surface-client's `Note`; `model.ts` projects notes into these.
 */
import type { Note } from "@openparachute/surface-client";

// ---- enum vocabularies (kept as const arrays for ordering + iteration) ----

export const WORK_STATUSES = [
  "inbox",
  "exploring",
  "planned",
  "in-progress",
  "blocked",
  "in-review",
  "shipped",
  "dropped",
] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_KINDS = ["brainstorm", "plan", "task", "bug", "chore"] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

export const PRIORITIES = ["p0", "p1", "p2"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const DECISION_STATUSES = [
  "proposed",
  "accepted",
  "superseded",
  "reversed",
] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const DECISION_SCOPES = [
  "product",
  "brand",
  "governance",
  "strategy",
  "hiring",
  "finance",
  "technical",
] as const;
export type DecisionScope = (typeof DECISION_SCOPES)[number];

export const MEETING_SERIES = [
  "parachute-weekly",
  "techne-lca",
  "gamescoop-friday",
  "gitcoin-sync",
  "fundraising",
  "ad-hoc",
] as const;
export type MeetingSeries = (typeof MEETING_SERIES)[number];

export const MEETING_STATUSES = [
  "scheduled",
  "held",
  "digested",
  "governed",
] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const STRATEGY_KINDS = [
  "business-plan",
  "fundraising",
  "positioning",
  "product-direction",
] as const;
export type StrategyKind = (typeof STRATEGY_KINDS)[number];

export const STRATEGY_STATUSES = ["draft", "active", "superseded"] as const;
export type StrategyStatus = (typeof STRATEGY_STATUSES)[number];

export const FEEDBACK_STATUSES = [
  "open",
  "acknowledged",
  "addressing",
  "resolved",
  "wontfix",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_SOURCES = [
  "direct",
  "email",
  "meeting",
  "github",
  "beta-form",
  "support",
] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

export const FEEDBACK_CATEGORIES = [
  "bug",
  "dx-gap",
  "feature-request",
  "positioning",
  "messaging",
  "praise",
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const RELATIONS = [
  "core-team",
  "collaborator",
  "advisor",
  "investor",
  "client",
  "user",
  "beta-user",
  "friend",
] as const;
export type Relation = (typeof RELATIONS)[number];

export const PROPOSAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const REPOS = [
  "parachute-hub",
  "parachute-vault",
  "parachute-surface",
  "parachute-scribe",
  "parachute-runner",
  "parachute-patterns",
  "parachute.computer",
  "parachute-brain",
  "parachute-workspace",
] as const;
export type Repo = (typeof REPOS)[number];

// ---- domain projections ----

export interface BaseEntity {
  note: Note;
  id: string;
  path: string;
  title: string;
  summary?: string;
}

export interface Person extends BaseEntity {
  relation?: Relation;
  role?: string;
  handle?: string;
  contact?: string;
  aliases?: string[];
}

export interface Org extends BaseEntity {
  kind?: string;
  affiliation?: string;
}

export interface Work extends BaseEntity {
  kind?: WorkKind;
  status?: WorkStatus;
  priority?: Priority;
  assignee?: string;
  target?: string;
  ghLinks?: string[];
  repos: Repo[];
}

export interface Decision extends BaseEntity {
  status?: DecisionStatus;
  scope?: DecisionScope;
  decidedOn?: string;
  supersedes?: string;
  supersededBy?: string;
}

export interface Meeting extends BaseEntity {
  series?: MeetingSeries;
  heldOn?: string;
  status?: MeetingStatus;
}

export interface Strategy extends BaseEntity {
  kind?: StrategyKind;
  status?: StrategyStatus;
  supersedes?: string;
}

export interface FeedbackTheme extends BaseEntity {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  severity?: Priority;
  captureCount?: number;
}

export interface FeedbackCapture extends BaseEntity {
  source?: string;
  reporter?: string;
  theme?: string;
}

export interface Proposal extends BaseEntity {
  status?: ProposalStatus;
  kind?: "entity" | "link";
  entityType?: string;
  entityName?: string;
  confidence?: number;
  evidence?: string;
}

export interface DailySummary extends BaseEntity {
  date?: string;
}

// ---- semantic-tint mapping (gentle; never loud) ----

export type Tint =
  | "forest"
  | "sky"
  | "amber"
  | "terracotta"
  | "stone"
  | "lavender";

export function workStatusTint(s?: WorkStatus): Tint {
  switch (s) {
    case "shipped":
      return "forest";
    case "in-progress":
    case "in-review":
      return "sky";
    case "blocked":
      return "amber";
    case "dropped":
      return "terracotta";
    case "exploring":
    case "planned":
      return "lavender";
    default:
      return "stone";
  }
}

export function priorityTint(p?: Priority): Tint {
  switch (p) {
    case "p0":
      return "terracotta";
    case "p1":
      return "amber";
    default:
      return "stone";
  }
}

export function kindTint(k?: WorkKind): Tint {
  switch (k) {
    case "bug":
      return "terracotta";
    case "plan":
      return "sky";
    case "brainstorm":
      return "lavender";
    default:
      return "stone";
  }
}

export function decisionTint(s?: DecisionStatus): Tint {
  switch (s) {
    case "accepted":
      return "forest";
    case "proposed":
      return "sky";
    case "superseded":
      return "stone";
    case "reversed":
      return "terracotta";
    default:
      return "stone";
  }
}

export function strategyStatusTint(s?: StrategyStatus): Tint {
  switch (s) {
    case "active":
      return "forest";
    case "draft":
      return "sky";
    case "superseded":
      return "stone";
    default:
      return "stone";
  }
}

export function strategyKindTint(k?: StrategyKind): Tint {
  switch (k) {
    case "business-plan":
      return "sky";
    case "fundraising":
      return "lavender";
    case "positioning":
      return "amber";
    case "product-direction":
      return "forest";
    default:
      return "stone";
  }
}

export function meetingStatusTint(s?: MeetingStatus): Tint {
  switch (s) {
    case "governed":
      return "forest";
    case "digested":
      return "sky";
    case "held":
      return "lavender";
    default:
      return "stone";
  }
}

export function feedbackStatusTint(s?: FeedbackStatus): Tint {
  switch (s) {
    case "resolved":
      return "forest";
    case "addressing":
    case "acknowledged":
      return "sky";
    case "open":
      return "amber";
    case "wontfix":
      return "stone";
    default:
      return "stone";
  }
}

export function categoryTint(c?: FeedbackCategory): Tint {
  switch (c) {
    case "bug":
      return "terracotta";
    case "praise":
      return "forest";
    case "feature-request":
      return "sky";
    case "dx-gap":
      return "amber";
    default:
      return "lavender";
  }
}

export function relationTint(r?: Relation): Tint {
  switch (r) {
    case "core-team":
      return "forest";
    case "investor":
      return "lavender";
    case "client":
      return "sky";
    case "advisor":
      return "amber";
    default:
      return "stone";
  }
}

export function proposalTint(s?: ProposalStatus): Tint {
  switch (s) {
    case "approved":
      return "forest";
    case "rejected":
      return "terracotta";
    default:
      return "sky";
  }
}

/** Deterministic gentle avatar color from a name. */
const AVATAR_COLORS = [
  "#4a7c59",
  "#5b8fa8",
  "#7c719e",
  "#a8773f",
  "#9c5a4a",
  "#5a8a6e",
  "#6b7a9e",
];
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]!;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** A subtle per-repo dot color so the cross-repo span reads at a glance. */
const REPO_COLORS: Record<Repo, string> = {
  "parachute-hub": "#5b8fa8",
  "parachute-vault": "#4a7c59",
  "parachute-surface": "#7c719e",
  "parachute-scribe": "#a8773f",
  "parachute-runner": "#9c5a4a",
  "parachute-patterns": "#5a8a6e",
  "parachute.computer": "#6b7a9e",
  "parachute-brain": "#8a6e5a",
  "parachute-workspace": "#6e7a8a",
};
export function repoColor(repo: string): string {
  return (REPO_COLORS as Record<string, string>)[repo] ?? "#9a9690";
}

/** Strip the `parachute-` / leading prefix for a tidy chip label. */
export function repoLabel(repo: string): string {
  return repo.replace(/^parachute[-.]/, "");
}
