/**
 * Library — the calm index of the supporting type-views. Home / Work / Weave
 * are the job-shaped top-nav tabs; everything else (Decisions, Meetings, Team,
 * Strategy, Modules, Feedback) lives one hop away, here. Each card is a quiet
 * door with a one-line description. The routes themselves are unchanged.
 */
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { PageHeader } from "../components/PageHeader";
import { staggerStyle } from "../lib/format";

interface Entry {
  to: string;
  title: string;
  desc: string;
  icon: ReactNode;
}

// Calm line-art glyphs, matched to the Shell's stroke idiom (1.6, round caps).
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const DecisionsIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M9 11l2 2 4-4" />
    <rect x="4" y="4" width="16" height="16" rx="2.5" />
  </svg>
);
const MeetingsIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9h17M8 3.5v3M16 3.5v3" />
  </svg>
);
const TeamIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.5-4.6" />
  </svg>
);
const StrategyIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
  </svg>
);
const ModulesIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);
const FeedbackIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M4 5h16v11H9l-4 4V5z" />
    <path d="M8.5 10.5h7M8.5 13h4" />
  </svg>
);

const ENTRIES: Entry[] = [
  {
    to: "/decisions",
    title: "Decisions",
    desc: "The record — every call we've made, reverse-chronological, with scope and supersession.",
    icon: <DecisionsIcon />,
  },
  {
    to: "/meetings",
    title: "Meetings",
    desc: "The timeline of syncs and their digests, with the sacred verbatim transcripts.",
    icon: <MeetingsIcon />,
  },
  {
    to: "/team",
    title: "Team",
    desc: "The roster — who's who across the core team, advisors, investors, and users.",
    icon: <TeamIcon />,
  },
  {
    to: "/strategy",
    title: "Strategy",
    desc: "The living positions — documents that meetings feed and decisions harden.",
    icon: <StrategyIcon />,
  },
  {
    to: "/modules",
    title: "Modules",
    desc: "The canon — what Parachute is made of, grouped by what each thing is.",
    icon: <ModulesIcon />,
  },
  {
    to: "/feedback",
    title: "Feedback",
    desc: "The themes — what users are telling us, grouped by status and severity.",
    icon: <FeedbackIcon />,
  },
];

export function Library() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="The rest of the brain"
        title="Library"
        lead="The supporting views — the record, the people, the positions, the canon. Everything that isn't the daily loop, one calm door each."
      />

      <div className="library-grid">
        {ENTRIES.map((e, i) => (
          <Link
            key={e.to}
            to={e.to}
            className="card card-hover library-card fade-up"
            style={staggerStyle(i)}
          >
            <div className="library-card-head">
              <span className="library-icon">{e.icon}</span>
              <span className="library-card-title">{e.title}</span>
            </div>
            <p className="library-card-desc">{e.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
