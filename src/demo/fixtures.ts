/**
 * Demo fixtures — a realistic mirror of the seeded `default` vault, so
 * screenshots in demo mode look like the real thing. Shape matches the
 * surface-client `Note` wire format (id / path / tags / metadata / content).
 *
 * Toggled via `?demo=1` or the localStorage flag (see vault.ts).
 */
import type { Note } from "@openparachute/surface-client";

const TODAY = "2026-06-02";

function note(
  id: string,
  path: string,
  tags: string[],
  metadata: Record<string, unknown>,
  content?: string,
  createdAt = "2026-05-20T09:00:00Z",
): Note {
  return {
    id,
    path,
    tags,
    metadata,
    content,
    createdAt,
    updatedAt: createdAt,
    preview: typeof metadata.summary === "string" ? metadata.summary : undefined,
  };
}

// ---------------------------------------------------------------- People ----

export const PEOPLE: Note[] = [
  note(
    "p-aaron",
    "People/Aaron Gabriel Neyer",
    ["person"],
    {
      relation: "core-team",
      role: "founder",
      handle: "aaron",
      contact: "ag@unforced.org",
      summary:
        "Founder. Builds the Parachute ecosystem end to end — vault, hub, the whole orchestration model. Runs Uni (UnforcedAGI) as an extension of his own intelligence.",
      aliases: ["Aaron", "AG"],
    },
    "# Aaron Gabriel Neyer\n\nFounder of Parachute. Architect of the vault-as-substrate model and the hub-as-portal OAuth design. Sets the calm, crafted bar for the whole product surface.",
  ),
  note(
    "p-jonbo",
    "People/Jon Bo",
    ["person"],
    {
      relation: "core-team",
      role: "founder",
      handle: "jonbo",
      summary:
        "Co-founder. Product instinct and the human side of the system — keeps the work honest about who it's for.",
    },
    "# Jon Bo\n\nCo-founder. Product and people.",
  ),
  note(
    "p-neil",
    "People/Neil Yarnal",
    ["person"],
    {
      relation: "core-team",
      role: "designer",
      handle: "neil",
      summary:
        "Designer. Owns the visual language — open sky, generous whitespace, the dot-logo. The brand is largely his.",
    },
    "# Neil Yarnal\n\nDesign lead. Shapes how Parachute feels.",
  ),
  note(
    "p-benjamin",
    "People/Benjamin Life",
    ["person"],
    {
      relation: "core-team",
      role: "builder",
      handle: "benjamin",
      summary:
        "Builder. Deep on the scribe transcription worker and the runner job substrate.",
    },
    "# Benjamin Life\n\nBuilder — scribe + runner.",
  ),
  note(
    "p-lucian",
    "People/Lucian Hymer",
    ["person"],
    {
      relation: "core-team",
      role: "builder",
      handle: "lucian",
      summary:
        "Builder. Hub internals, OAuth issuance, the supervisor-unification arc.",
    },
    "# Lucian Hymer\n\nBuilder — hub + auth.",
  ),
  note(
    "p-todd",
    "People/Todd Youngblood",
    ["person"],
    {
      relation: "core-team",
      role: "legal",
      handle: "todd",
      summary:
        "Legal + structure. Handles the Open Parachute PVC venture form and the cooperative questions.",
    },
    "# Todd Youngblood\n\nLegal + venture structure.",
  ),
  note(
    "p-marvin",
    "People/Marvin Melzer",
    ["person"],
    {
      relation: "core-team",
      role: "connector",
      handle: "marvin",
      summary: "Core team — connector and operations.",
    },
    "# Marvin Melzer\n\nCore team.",
  ),
  note(
    "p-natalie",
    "People/Natalie Levy",
    ["person"],
    {
      relation: "investor",
      role: "connector",
      handle: "natalie",
      summary:
        "Investor and connector. Opens doors across the regen + AI-livelihood worlds.",
    },
    "# Natalie Levy\n\nInvestor + connector.",
  ),
  note(
    "p-tim",
    "People/Tim",
    ["person"],
    {
      relation: "investor",
      role: "investor",
      handle: "tim",
      summary: "Investor. Early believer in the owner-operated thesis.",
    },
    "# Tim\n\nInvestor.",
  ),
  note(
    "p-kevin",
    "People/Kevin Owocki",
    ["person"],
    {
      relation: "user",
      role: "founder",
      handle: "owocki",
      summary:
        "Gitcoin founder. Runs the Gitcoin Brain — the canonical vault-as-job-substrate user. The rebuild.how AI-livelihood work lives in his shared brain.",
    },
    "# Kevin Owocki\n\nGitcoin founder. Power user of the vault-as-substrate pattern.",
  ),
];

// ------------------------------------------------------------------ Orgs ----

export const ORGS: Note[] = [
  note(
    "o-techne",
    "Orgs/Techne",
    ["org"],
    {
      kind: "cooperative",
      affiliation: "partner",
      summary:
        "Cooperative. Partner in the LCA (Limited Cooperative Association) structure conversations.",
    },
    "# Techne\n\nCooperative partner.",
  ),
  note(
    "o-gitcoin",
    "Orgs/Gitcoin",
    ["org"],
    {
      kind: "client",
      affiliation: "client",
      summary:
        "Client. Runs the Gitcoin Brain on the vault-as-substrate model; sole focus is rebuild.how, an AI-livelihood movement.",
    },
    "# Gitcoin\n\nClient running the shared-brain pattern.",
  ),
  note(
    "o-opv",
    "Orgs/Open Parachute PVC",
    ["org"],
    {
      kind: "venture",
      affiliation: "self",
      summary:
        "The venture entity. Perpetual-purpose / PVC structure for the Parachute product company.",
    },
    "# Open Parachute PVC\n\nThe venture entity.",
  ),
];

// ------------------------------------------------------------------ Work ----

export const WORK: Note[] = [
  note(
    "w-app-rename",
    "Work/parachute-app-dir-rename",
    ["work", "repo/parachute-surface"],
    {
      kind: "chore",
      status: "in-progress",
      priority: "p2",
      assignee: "lucian",
      summary:
        "Rename parachute-app → parachute-surface across the workspace: CLAUDE.md, package metadata, design-doc slugs, cross-repo references.",
      gh_links: ["hub#480", "vault#412", "parachute-surface#1"],
      target: "2026-06-05",
    },
    "# parachute-app → parachute-surface rename\n\nConsolidating the host-module naming. The repo became `parachute-surface` on 2026-05-27; this chore chases the references that point at the old slug.\n\nDone:\n- workspace `CLAUDE.md`\n- design-doc slug typo fix\n\nRemaining:\n- a few stale pattern-doc references caught by the canonical-refs audit.",
  ),
  note(
    "w-auth-arc",
    "Work/auth-unification-arc",
    ["work", "repo/parachute-vault", "repo/parachute-hub"],
    {
      kind: "plan",
      status: "shipped",
      priority: "p1",
      assignee: "lucian",
      summary:
        "Retire pvt_* tokens via capability attenuation; self-heal origin-pinned credentials on expose. The class behind the recurring \"not signed in to the hub\".",
      gh_links: [
        "parachute-vault#412",
        "parachute-hub#480",
        "parachute-hub#481",
        "parachute-vault#415",
      ],
    },
    "# Auth-unification arc\n\nTwo sessions. Session 1 dropped `pvt_*` (vault#412). Session 2 fixed origin-pinned-credential staleness on Cloudflare deploys — vault `.env` hub-origin self-heal (#480), operator.token issuer self-heal (#481), friendly `git_not_installed` (#415).\n\nBoth boxes on hub 0.5.14-rc.18 + vault 0.5.0-rc.2. Only the stable @latest release remains, gated on Aaron.",
  ),
  note(
    "w-supervisor",
    "Work/hub-as-supervisor-unification",
    [
      "work",
      "repo/parachute-hub",
      "repo/parachute-vault",
      "repo/parachute-surface",
      "repo/parachute-scribe",
      "repo/parachute-runner",
    ],
    {
      kind: "plan",
      status: "exploring",
      priority: "p1",
      assignee: "aaron",
      summary:
        "Unify ALL deploys on `parachute serve` (hub-as-supervisor, modules = children) under a per-platform process manager. Retire the manager-less detached-daemon model.",
      gh_links: ["parachute-hub#260"],
      target: "2026-06-20",
    },
    "# Hub-as-supervisor unification\n\nDecided 2026-06-01. Unify EC2 + Render + Fly on one model: `parachute serve` runs hub as supervisor with modules as children, under systemd / launchd / container per platform.\n\nWhy: the detached-daemon model splits EC2 from Render, blocks UI module-management, and doesn't survive reboot. Design-doc-first, phased, gated. `parachute start` becomes \"serve in the background\"; per-module CLI ops preserved via the supervisor API.",
  ),
  note(
    "w-obsidian",
    "Work/obsidian-parser-convergence",
    ["work", "repo/parachute-vault", "repo/parachute-surface"],
    {
      kind: "plan",
      status: "shipped",
      priority: "p2",
      assignee: "benjamin",
      summary:
        "Two drifted Obsidian parsers (CLI-core vs Notes-UI browser); hub admin had none. Aligned in-place against a shared behavior contract + fixtures.",
      gh_links: ["parachute-vault#424", "parachute-surface#61"],
    },
    "# Obsidian-import parser convergence\n\nShared parser was infeasible (core isn't browser-importable), so each was fixed against a shared behavior contract + fixtures. A cross-repo convergence audit caught a divergence single-repo reviewers missed.\n\nDeferred: the /account \"Import notes ↗\" deep-link.",
  ),
  note(
    "w-aud",
    "Work/hub-512-rfc8707-aud",
    ["work", "repo/parachute-hub"],
    {
      kind: "bug",
      status: "in-review",
      priority: "p1",
      assignee: "lucian",
      summary:
        "RFC 8707 resource indicator / audience handling on token exchange. NOT the Claude connector blocker — Claude accepts aud=vault.default — but worth getting right.",
      gh_links: ["parachute-hub#511", "parachute-hub#512"],
    },
    "# hub#512 — RFC 8707 aud / resource\n\nTightening audience + resource-indicator handling on token exchange. Confirmed via real users that this is NOT what blocks Claude's MCP connector (that's Cloudflare bot protection). Still worth landing for correctness.",
  ),
  note(
    "w-tunnel",
    "Work/cloudflare-per-host-tunnel",
    ["work", "repo/parachute-hub"],
    {
      kind: "plan",
      status: "shipped",
      priority: "p1",
      assignee: "lucian",
      summary:
        "Per-host Cloudflare tunnel — old shared name load-balanced connectors across machines → cross-host 404s. Plus reboot-persistent connector via launchd/systemd.",
      gh_links: ["parachute-hub#491", "parachute-hub#493", "parachute-hub#494"],
    },
    "# Cloudflare per-host tunnel\n\nTunnels are account-wide; a fixed `DEFAULT_TUNNEL_NAME=\"parachute\"` made two machines share one tunnel UUID → CF load-balanced connectors → cross-host 404s.\n\nShipped: per-host tunnel (hub 0.6.1, #491); reboot-persistent connector (hub 0.6.2, #493). Headless non-root boxes need `loginctl enable-linger` (#494).",
  ),
  note(
    "w-brain",
    "Work/build-parachute-brain-surface",
    ["work", "repo/parachute-surface"],
    {
      kind: "plan",
      status: "planned",
      priority: "p1",
      assignee: "aaron",
      summary:
        "Build Parachute Brain — the team's internal web surface over the project vault. Calm, on-brand, the at-a-glance team-sync home.",
      target: "2026-06-10",
    },
    "# Build Parachute Brain\n\nTHE internal surface for the team. Today / Work / Decisions / Feedback / Meetings / Team / Weave. Embodies the brand: calm, crafted, open sky. Built on surface-client + surface-render.",
  ),
  note(
    "w-weave-job",
    "Work/morning-weave-job",
    ["work", "repo/parachute-runner"],
    {
      kind: "plan",
      status: "planned",
      priority: "p2",
      assignee: "benjamin",
      summary:
        "A runner job that digests overnight captures into proposals for the Weave queue — entity + link suggestions for the team to approve each morning.",
    },
    "# Morning weave job\n\nA `tag:job` note the runner spawns `claude -p` against each morning: read new captures, propose entities + links, drop them in the Weave queue as `proposal` notes with status=pending.",
  ),
  // inbox / exploring filler so the kanban reads full
  note(
    "w-inbox-1",
    "Work/scribe-language-autodetect",
    ["work", "repo/parachute-scribe"],
    {
      kind: "task",
      status: "inbox",
      priority: "p2",
      summary: "Auto-detect source language before transcription.",
    },
    "# Scribe language autodetect\n\nIdea from a beta user — detect language so they don't have to set it per upload.",
  ),
  note(
    "w-explore-1",
    "Work/runner-cost-ceilings",
    ["work", "repo/parachute-runner"],
    {
      kind: "brainstorm",
      status: "exploring",
      priority: "p2",
      assignee: "benjamin",
      summary: "Per-job spend ceilings so a runaway job can't burn the budget.",
    },
    "# Runner cost ceilings\n\nExploring a per-job token/dollar ceiling with a soft warn + hard stop.",
  ),
];

// ------------------------------------------------------------- Decisions ----

export const DECISIONS: Note[] = [
  note(
    "d-supervisor",
    "Decisions/2026-06-01-hub-as-supervisor",
    ["decision"],
    {
      status: "accepted",
      scope: "technical",
      decided_on: "2026-06-01",
      summary:
        "Unify all deploys on hub-as-supervisor (`parachute serve`, modules as children) under a per-platform process manager. Retire the manager-less detached-daemon model.",
    },
    "# Hub-as-supervisor unification\n\n**Accepted 2026-06-01.**\n\nThe detached-daemon model splits EC2 from Render, blocks UI module-management, and doesn't survive reboot. We unify on `parachute serve` — hub supervises modules as children — under systemd / launchd / container per platform.\n\nPhased and gated. Design-doc first.",
    "2026-06-01T17:00:00Z",
  ),
  note(
    "d-fly",
    "Decisions/2026-05-26-fly-as-peer",
    ["decision"],
    {
      status: "accepted",
      scope: "strategy",
      decided_on: "2026-05-26",
      summary:
        "Fly is a PEER self-host option alongside Render, not a replacement. \"For now, this is a self-host offering alongside Render.\" Phase 1 only.",
    },
    "# Fly as peer self-host\n\n**Accepted 2026-05-26.**\n\nFly sits alongside Render as a self-host target — not a replacement. Phase 1 only committed; framing must not demote Render.",
    "2026-05-26T15:00:00Z",
  ),
  note(
    "d-notes-app",
    "Decisions/2026-05-24-notes-as-app",
    ["decision"],
    {
      status: "accepted",
      scope: "product",
      decided_on: "2026-05-24",
      summary:
        "notes-ui moves into parachute-surface/packages/notes-ui. Consolidate \"host module + bundled reference apps\" in one repo; archive parachute-notes.",
    },
    "# Notes-as-app\n\n**Accepted 2026-05-24.**\n\nNotes was always conceptually \"an app that consumes a vault,\" not a backend service. With parachute-surface auto-bootstrapping `@openparachute/notes-ui`, the daemon's role collapsed to a static-serve wrapper. Move the source into `parachute-surface/packages/notes-ui`; archive `parachute-notes`. Future reference apps (calendar, tasks) land the same way.",
    "2026-05-24T11:00:00Z",
  ),
  note(
    "d-committed-core",
    "Decisions/2026-05-22-committed-core",
    ["decision"],
    {
      status: "accepted",
      scope: "strategy",
      decided_on: "2026-05-22",
      summary:
        "Committed-core line is vault / surface / scribe / hub. Everything else lives but isn't promoted. Redrawn when Notes-as-daemon migrated to Notes-as-app.",
      superseded_by: "",
    },
    "# Committed-core line\n\n**Accepted 2026-05-22.**\n\nThe four committed-core modules are the product surface: **vault, surface, scribe, hub**. Runner is shipped but not yet promoted. Agent retired. Everything else is exploration or archive.\n\nCommitted-core is a commitment statement; hub's manifest registries are implementation details — separate axes.",
    "2026-05-22T10:00:00Z",
  ),
  note(
    "d-governance",
    "Decisions/2026-04-25-governance",
    ["decision"],
    {
      status: "accepted",
      scope: "governance",
      decided_on: "2026-04-25",
      summary:
        "Three governance rules: no auto-merge; RC versioning before @latest; patterns-check in every review. PR-only, reviewer-gated, no direct-to-main anywhere.",
    },
    "# Governance\n\n**Accepted 2026-04-25.**\n\n1. **No auto-merge.** Tentacles open PRs and report; the human clicks merge.\n2. **RC versioning before @latest.** Pre-1.0, every code-touching PR bumps `rc.N`; drop the suffix only on explicit ready-for-release.\n3. **Patterns check in every review.** Each review surfaces which patterns the change touches.\n\nAll core repos have branch protection on `main`.",
    "2026-04-25T14:00:00Z",
  ),
];

// -------------------------------------------------------------- Meetings ----

export const MEETINGS: Note[] = [
  note(
    "m-weekly-0602",
    "Meetings/2026-06-02-parachute-weekly",
    ["meeting"],
    {
      series: "parachute-weekly",
      held_on: "2026-06-02",
      status: "scheduled",
      summary:
        "Weekly sync. Agenda: hub-as-supervisor design-doc review, stable @latest release gate, Parachute Brain demo.",
    },
    "# Parachute Weekly — 2026-06-02\n\n_Scheduled._\n\nAgenda:\n- Hub-as-supervisor design doc — first read\n- Stable @latest release: are we ready to drop the -rc?\n- Parachute Brain — demo the internal surface",
    "2026-06-02T16:00:00Z",
  ),
  note(
    "m-weekly-0526",
    "Meetings/2026-05-26-parachute-weekly",
    ["meeting"],
    {
      series: "parachute-weekly",
      held_on: "2026-05-26",
      status: "governed",
      summary:
        "Weekly sync. Produced the Fly-as-peer decision. Confirmed Render stays primary self-host framing.",
    },
    "# Parachute Weekly — 2026-05-26\n\n_Governed — produced 1 decision._\n\nDiscussed Fly as a self-host target. Landed on **peer, not replacement**. Render framing stays primary.\n\nProduced: [[Decisions/2026-05-26-fly-as-peer]]",
    "2026-05-26T16:00:00Z",
  ),
  note(
    "m-lca-0524",
    "Meetings/2026-05-24-techne-lca",
    ["meeting"],
    {
      series: "techne-lca",
      held_on: "2026-05-24",
      status: "digested",
      summary:
        "Cooperative-structure conversation with Techne. Explored LCA vs PVC tradeoffs for the venture form.",
    },
    "# Techne LCA — 2026-05-24\n\n_Digested._\n\nWorked through Limited Cooperative Association vs Perpetual Venture structure with Techne. Action items captured; no governance decision yet.",
    "2026-05-24T18:00:00Z",
  ),
  note(
    "m-gitcoin-0521",
    "Meetings/2026-05-21-gitcoin-sync",
    ["meeting"],
    {
      series: "gitcoin-sync",
      held_on: "2026-05-21",
      status: "held",
      summary:
        "Sync with Gitcoin on the shared-brain pattern. Runner Phase 1 complete; rebuild.how knowledge base growing.",
    },
    "# Gitcoin Sync — 2026-05-21\n\n_Held._\n\nReviewed the Gitcoin Brain — 534 notes, freeform tags, vault-as-substrate working well. Runner Phase 1 complete. rebuild.how is their sole focus.",
    "2026-05-21T19:00:00Z",
  ),
  note(
    "m-friday-0530",
    "Meetings/2026-05-30-gamescoop-friday",
    ["meeting"],
    {
      series: "gamescoop-friday",
      held_on: "2026-05-30",
      status: "held",
      summary: "Friday community session. Demos + open hacking.",
    },
    "# Gamescoop Friday — 2026-05-30\n\n_Held._\n\nCommunity demos and open hacking.",
    "2026-05-30T22:00:00Z",
  ),
];

// -------------------------------------------------------------- Feedback ----

export const FEEDBACK_THEMES: Note[] = [
  note(
    "ft-auth-friction",
    "Feedback/themes/expose-connect-auth-friction",
    ["feedback-theme"],
    {
      status: "addressing",
      category: "dx-gap",
      severity: "p1",
      capture_count: 2,
      summary:
        "Connecting a client (Claude / Notes) after exposing the hub publicly hits two distinct walls: stale origin-pinned credentials, and Cloudflare bot protection blocking the server-to-server MCP token exchange.",
    },
    "# Theme — expose + connect auth friction\n\n_Addressing._ Severity p1.\n\nTwo raw captures feed this:\n\n1. **\"Not signed in to the hub\"** — origin-pinned credentials (vault `.env` hub-origin, operator.token iss) go stale after init-at-loopback → expose-public. Self-heal-on-start shipped (hub#480/#481).\n2. **Cloudflare bot protection** 403s Claude's server-to-server token-exchange + MCP — consent passes in-browser, then \"rejected the credentials,\" nothing in hub.log. Fix is in the operator's CF dashboard (relax Bot Fight Mode), documented at parachute.computer#91.\n\nDrives: [[Work/auth-unification-arc]].",
  ),
  note(
    "ft-praise-calm",
    "Feedback/themes/it-feels-calm",
    ["feedback-theme"],
    {
      status: "acknowledged",
      category: "praise",
      severity: "p2",
      capture_count: 1,
      summary:
        "Beta users keep using the word \"calm\" unprompted. The open-sky design language is landing.",
    },
    "# Theme — it feels calm\n\n_Acknowledged._\n\nMultiple beta users describe the product as \"calm\" and \"unhurried\" without prompting. The brand language is doing its job. Worth protecting as we add surfaces.",
  ),
];

export const FEEDBACK_CAPTURES: Note[] = [
  note(
    "fc-not-signed-in",
    "Feedback/raw/not-signed-in-to-hub",
    ["capture/feedback"],
    {
      source: "beta-email",
      reporter: "owocki",
      theme: "expose-connect-auth-friction",
      summary:
        "\"I exposed the hub and now the CLI says I'm not signed in, even though I just authed in the browser.\"",
    },
    "# Capture — not signed in to hub\n\nSource: beta email. Reporter: Kevin (owocki).\n\n> I ran expose, opened the public URL, signed in fine in the browser — but the CLI keeps saying I'm not signed in to the hub. Re-running auth doesn't fix it.\n\n→ Theme: [[Feedback/themes/expose-connect-auth-friction]]",
  ),
  note(
    "fc-cf-bot",
    "Feedback/raw/cloudflare-bot-blocks-mcp",
    ["capture/feedback"],
    {
      source: "discord",
      reporter: "natalie",
      theme: "expose-connect-auth-friction",
      summary:
        "\"Claude connects in the browser, then says it rejected the credentials. Nothing shows up in hub.log.\"",
    },
    "# Capture — Cloudflare bot blocks MCP\n\nSource: Discord. Reporter: Natalie.\n\n> Claude's consent screen works, I approve, then it says it rejected the credentials. There's nothing in hub.log at all — like the request never arrived.\n\nDiagnosis: Cloudflare Bot Fight Mode is 403-ing the server-to-server token exchange. Fix is in the operator's CF dashboard.\n\n→ Theme: [[Feedback/themes/expose-connect-auth-friction]]",
  ),
];

// ------------------------------------------------------------- Proposals ----

export const PROPOSALS: Note[] = [
  note(
    "prop-jess",
    "Proposals/person-jess-klein",
    ["proposal"],
    {
      status: "pending",
      kind: "entity",
      entity_type: "person",
      entity_name: "Jess Klein",
      confidence: 0.82,
      evidence:
        "Mentioned in the 2026-05-30 Gamescoop Friday digest as leading a community-design session; not yet in the People roster.",
      summary: "Add Jess Klein as a collaborator (designer).",
    },
    "# Proposal — add Jess Klein\n\nThe weave job noticed \"Jess Klein\" referenced in a meeting digest, leading a community-design session, but she's not in the People roster.\n\n**Proposed entity:** person · Jess Klein · collaborator/designer\n**Confidence:** 0.82",
  ),
  note(
    "prop-link",
    "Proposals/link-aud-bug-to-tunnel",
    ["proposal"],
    {
      status: "pending",
      kind: "link",
      entity_type: "work",
      entity_name: "hub-512-rfc8707-aud ↔ cloudflare-per-host-tunnel",
      confidence: 0.64,
      evidence:
        "Both touch the Claude-connector failure path on exposed hubs; the captures conflate them. A relates-to link would help future readers untangle the two.",
      summary: "Link hub-512-rfc8707-aud relates-to cloudflare-per-host-tunnel.",
    },
    "# Proposal — link aud-bug ↔ tunnel\n\nBoth work items live near the \"connector fails on exposed hub\" symptom, and users conflate them. Propose a `relates-to` link so the distinction (aud is NOT the blocker; CF bot protection is) is one hop away.\n\n**Confidence:** 0.64",
  ),
  note(
    "prop-org",
    "Proposals/org-rebuild-how",
    ["proposal"],
    {
      status: "pending",
      kind: "entity",
      entity_type: "org",
      entity_name: "rebuild.how",
      confidence: 0.71,
      evidence:
        "Referenced repeatedly in Gitcoin syncs as their sole focus (an AI-livelihood movement) but has no Orgs/ note of its own.",
      summary: "Add rebuild.how as an org (movement, affiliated with Gitcoin).",
    },
    "# Proposal — add rebuild.how\n\nGitcoin's sole focus, referenced across syncs, but not its own entity. Propose an org note linked to [[Orgs/Gitcoin]].\n\n**Confidence:** 0.71",
  ),
];

// ---------------------------------------------------------- Daily summary ----

export const DAILY: Note[] = [
  note(
    `s-daily-${TODAY}`,
    `summaries/daily/${TODAY}`,
    ["summary/daily"],
    {
      date: TODAY,
      summary: "Team sync for 2026-06-02.",
    },
    `Two streams are live and one gate remains.\n\n**Auth-unification** landed end to end — both boxes run hub 0.5.14-rc.18 + vault 0.5.0-rc.2, the origin-pinned-credential staleness class is closed, and the only thing left is dropping the \`-rc\` for the stable @latest release. That call is Aaron's.\n\n**Hub-as-supervisor** is the next big arc — accepted yesterday, now in the design-doc-first phase. It unifies EC2 / Render / Fly on \`parachute serve\` and unblocks UI module-management plus reboot survival.\n\nOn the connector front: confirmed via real users that the RFC 8707 \`aud\` work is _not_ what blocks Claude's MCP — that's Cloudflare bot protection, fixed in the operator's dashboard. The feedback theme is tracking both walls.\n\nQuiet, steady day. Nothing on fire.`,
    `${TODAY}T08:30:00Z`,
  ),
];

// -------------------------------------------------------------- Strategy ----
// Generic placeholders only — demo mode ships in the public bundle, so no
// real fundraising numbers belong here.

export const STRATEGY: Note[] = [
  note(
    "demo-strategy-1",
    "Strategy/business-plan",
    ["strategy"],
    {
      kind: "business-plan",
      status: "draft",
      summary:
        "Draft v1 — what we sell, the round, use of funds, unit economics, milestones. Assumptions register awaiting confirmation.",
    },
    "# Business Plan\n\n**DRAFT v1.** What we sell → the raise → use of funds → unit economics → revenue path → milestones → risks. Numbers in the assumptions register are placeholders awaiting confirmation.",
    "2026-06-01T16:00:00Z",
  ),
  note(
    "demo-strategy-2",
    "Strategy/positioning",
    ["strategy"],
    {
      kind: "positioning",
      status: "active",
      summary:
        "The wedge: your AI keeps forgetting; Parachute is the user-owned memory layer underneath all of them.",
    },
    "# Positioning\n\nInteroperable, intuitive, integrated. The user-owned memory & knowledge layer for humans and their AI — the spine, not another silo.",
    "2026-05-28T12:00:00Z",
  ),
];

// --------------------------------------------------------------- Modules ----
// The canonical module registry (Canon/Modules/*, tag:module). Mirrors the
// seeded vault so the Modules view renders fully in demo mode.

export const MODULES: Note[] = [
  note(
    "mod-vault",
    "Canon/Modules/Vault",
    ["module", "repo/parachute-vault"],
    {
      kind: "module",
      role: "committed-core",
      status: "live",
      repo_slug: "parachute-vault",
      npm: ["@openparachute/vault"],
      summary:
        "The memory layer — a knowledge graph served over MCP and a plain HTTP REST API. The substrate every other module reads and writes.",
    },
    "# Vault\n\nThe memory layer — a knowledge graph of notes (markdown + metadata + typed graph links), exposed over both MCP and a plain HTTP REST API. The substrate every other module reads and writes.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-hub",
    "Canon/Modules/Hub",
    ["module", "repo/parachute-hub"],
    {
      kind: "module",
      role: "committed-core",
      status: "live",
      repo_slug: "parachute-hub",
      npm: ["@openparachute/hub"],
      port: "1939",
      summary:
        "The portal on :1939 — OAuth issuer, service catalog, install/CLI surface, and (since 0.6.3) the process supervisor for all modules.",
    },
    "# Hub\n\nThe portal and front door on :1939. The project's auth root (OAuth issuer), the service catalog, the `parachute` CLI surface, and — since 0.6.3 — the process supervisor that runs every other module as a child.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-surface",
    "Canon/Modules/Surface",
    ["module", "repo/parachute-surface"],
    {
      kind: "module",
      role: "committed-core",
      status: "live",
      repo_slug: "parachute-surface",
      npm: [
        "@openparachute/surface-client",
        "@openparachute/surface-render",
        "@openparachute/notes-ui",
      ],
      summary:
        "The UI host module + bundled reference surfaces (notes-ui) + the surface-builder SDK (surface-client / surface-render).",
    },
    "# Surface\n\nThe UI layer. A host module that serves bundled reference surfaces (Notes, future calendar/tasks), plus the surface-builder SDK — `surface-client` (auth + api) and `surface-render` (the renderer) — that makes a custom surface a thin import.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-scribe",
    "Canon/Modules/Scribe",
    ["module", "repo/parachute-scribe"],
    {
      kind: "module",
      role: "committed-core",
      status: "live",
      repo_slug: "parachute-scribe",
      npm: ["@openparachute/scribe"],
      summary:
        "The transcription worker — turns audio/meetings into text that lands as vault captures.",
    },
    "# Scribe\n\nThe transcription worker — turns audio into text. The upstream of the meeting/capture pipeline: a recording becomes a vault capture.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-runner",
    "Canon/Modules/Runner",
    ["module", "repo/parachute-runner"],
    {
      kind: "module",
      role: "shipped-not-promoted",
      status: "live",
      repo_slug: "parachute-runner",
      npm: [],
      summary:
        "Vault-as-job-substrate — spawns claude -p against tag:job notes. The lightweight automation primitive; the weave engine.",
    },
    "# Runner\n\nVault-as-job-substrate — a lightweight runner that spawns `claude -p` against `tag:job` notes. The owner-operated automation primitive and the engine behind the Weave. Shipped (Phase 1, 2026-05-21); not yet promoted to committed-core.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-channel",
    "Canon/Modules/Channel",
    ["module", "repo/parachute-channel"],
    {
      kind: "module",
      role: "exploration",
      status: "wip",
      repo_slug: "parachute-channel",
      npm: [],
      summary:
        "Being redefined from a webhook fan-out into the agent-session gateway — named channels routing to resident Claude Code sessions.",
    },
    "# Channel\n\nFormerly a webhook fan-out marked \"may retire\"; being redefined into the agent-session gateway — named channels routing to resident Claude Code sessions.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-brain",
    "Canon/Modules/Brain",
    ["module", "repo/parachute-brain"],
    {
      kind: "app",
      role: "internal-tooling",
      status: "live",
      repo_slug: "parachute-brain",
      npm: [],
      summary:
        "The team's internal surface over THIS vault (this app) — Work/Decisions/Feedback/Meetings/Strategy/Weave/Modules views.",
    },
    "# Brain\n\nThe team's internal surface over this vault — the app you're reading the vault through. Work / Decisions / Feedback / Meetings / Strategy / Weave / Modules. Built on the surface SDK; live on GitHub Pages; self-merge delegated.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-patterns",
    "Canon/Modules/Patterns",
    ["module", "repo/parachute-patterns"],
    {
      kind: "docs",
      role: "core-support",
      status: "live",
      repo_slug: "parachute-patterns",
      npm: [],
      summary:
        "Cross-cutting conventions (docs-only): naming, brand, governance, ports, module protocol, schemas, migration checklists.",
    },
    "# Patterns\n\nThe cross-cutting conventions repo (docs-only, no code). Naming, brand, governance, ports, module protocol, OAuth scopes, schemas, migration checklists, and the canonical-refs audit script.",
    "2026-06-08T14:30:00Z",
  ),
  note(
    "mod-site",
    "Canon/Modules/Site",
    ["module", "repo/parachute.computer"],
    {
      kind: "site",
      role: "core-support",
      status: "live",
      repo_slug: "parachute.computer",
      npm: [],
      summary:
        "The public site + blog (parachute.computer), built with Eleventy. Candidate to become generated from this vault.",
    },
    "# Site (parachute.computer)\n\nThe public marketing site + blog, built with Eleventy on GitHub Pages. A candidate to become generated from this vault via a publish tag.",
    "2026-06-08T14:30:00Z",
  ),
];

// ----------------------------------------------------------------- index ----

export const ALL_NOTES: Note[] = [
  ...PEOPLE,
  ...ORGS,
  ...WORK,
  ...DECISIONS,
  ...STRATEGY,
  ...MEETINGS,
  ...FEEDBACK_THEMES,
  ...FEEDBACK_CAPTURES,
  ...PROPOSALS,
  ...DAILY,
  ...MODULES,
];
