/**
 * Modules — the canonical registry of what Parachute is made of, rendered
 * from the vault's `Canon/Modules/*` notes (tag:module).
 *
 * Grouped by `kind` — the whole point of the view. A docs repo and a platform
 * module both read "live", but they're different *kinds* of thing; the
 * grouping makes the module-vs-app-vs-docs distinction legible at a glance.
 * Within a group, sorted by `role` (commitment level), then alphabetically.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toModule } from "../data/model";
import { Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import {
  MODULE_KINDS,
  moduleRoleTint,
  moduleStatusTint,
  repoColor,
  type Module,
  type ModuleKind,
  type ModuleRole,
} from "../data/schema";
import { label, noteHref, staggerStyle } from "../lib/format";

// Section order + human headings. Docs + site share the "Support" section.
const SECTIONS: { heading: string; kinds: ModuleKind[]; blurb?: string }[] = [
  {
    heading: "Platform modules",
    kinds: ["module"],
    blurb: "The hub-installable services.",
  },
  {
    heading: "Apps & surfaces",
    kinds: ["app"],
    blurb: "Faces over a vault.",
  },
  {
    heading: "Support",
    kinds: ["docs", "site"],
    blurb: "The repos that hold the four together — conventions and the public face.",
  },
  {
    heading: "Libraries",
    kinds: ["library"],
    blurb: "Shared building blocks.",
  },
];

// Commitment order — committed-core first, then the rest of the gradient.
const ROLE_ORDER: Record<ModuleRole, number> = {
  "committed-core": 0,
  "shipped-not-promoted": 1,
  "core-support": 2,
  "internal-tooling": 3,
  exploration: 4,
  archived: 5,
  retired: 6,
};

function roleRank(r?: ModuleRole): number {
  return r ? (ROLE_ORDER[r] ?? 7) : 7;
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

// The card root is a plain <div>, NOT a Link — so the GitHub repo link and
// npm chips below can be real, keyboard-accessible <a> siblings without ever
// nesting an anchor inside an anchor (invalid HTML). Only the title is a Link.
function ModuleCard({ m, i }: { m: Module; i: number }) {
  return (
    <div className="card module-card fade-up" style={staggerStyle(i)}>
      <div className="module-card-head">
        {m.repoSlug && (
          <span
            className="dot module-dot"
            style={{ background: repoColor(m.repoSlug) }}
            aria-hidden="true"
          />
        )}
        <Link to={noteHref(m.path)} className="module-name">
          {m.title}
        </Link>
      </div>

      <div className="module-pills">
        {m.role && (
          <Pill tint={moduleRoleTint(m.role)} dot>
            {label(m.role)}
          </Pill>
        )}
        {m.status && (
          <Pill tint={moduleStatusTint(m.status)}>{label(m.status)}</Pill>
        )}
        {m.kind && <span className="module-kind-chip">{m.kind}</span>}
      </div>

      {m.summary && <p className="module-summary">{m.summary}</p>}

      <div className="module-links">
        {m.repoSlug && (
          <a
            href={`https://github.com/ParachuteComputer/${m.repoSlug}`}
            target="_blank"
            rel="noreferrer"
            className="module-repo-link"
            title={`ParachuteComputer/${m.repoSlug}`}
          >
            <GitHubMark />
            {m.repoSlug}
          </a>
        )}
        {m.npm.map((pkg) => (
          <a
            key={pkg}
            href={`https://www.npmjs.com/package/${pkg}`}
            target="_blank"
            rel="noreferrer"
            className="module-npm-chip"
            title={pkg}
          >
            <span className="module-npm-mark">npm</span>
            {pkg}
          </a>
        ))}
        {m.port && (
          <span className="module-port" title="Default port">
            :{m.port}
          </span>
        )}
      </div>
    </div>
  );
}

export function Modules() {
  const { data, loading, error } = useNotes({
    tag: "module",
    include_metadata: "true",
    limit: "100",
  });

  // Bucket by kind only — the authoritative sort happens at render time over
  // each section's merged array (Support folds docs + site together).
  const byKind = useMemo(() => {
    const mods = (data ?? []).map(toModule);
    const map = new Map<ModuleKind, Module[]>();
    for (const k of MODULE_KINDS) map.set(k, []);
    for (const m of mods) {
      if (m.kind && map.has(m.kind)) map.get(m.kind)!.push(m);
    }
    return map;
  }, [data]);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;

  // Count of projected modules (notes with a recognized kind), not raw notes —
  // a tag:module note with an unknown kind falls into no bucket and isn't shown.
  const total = [...byKind.values()].reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="The canon"
        title="Modules"
        lead="What Parachute is made of — grouped by what each thing is. Platform modules are the hub-installable services; apps are surfaces over a vault; support repos hold the conventions and the public face. The pills carry the commitment level and the lifecycle."
      />

      {total === 0 ? (
        <Empty
          title="No modules registered yet"
          text="The Canon/Modules registry in the vault is empty."
        />
      ) : (
        SECTIONS.map((section) => {
          const items = section.kinds.flatMap((k) => byKind.get(k) ?? []);
          // Re-sort across merged kinds (Support = docs + site).
          items.sort((a, b) => {
            const r = roleRank(a.role) - roleRank(b.role);
            if (r !== 0) return r;
            return a.title.localeCompare(b.title);
          });
          if (items.length === 0) return null;
          return (
            <section key={section.heading} className="section">
              <div className="section-head">
                <h2 className="section-title">{section.heading}</h2>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {items.length}
                </span>
              </div>
              {section.blurb && (
                <p
                  className="muted"
                  style={{ fontSize: "0.9rem", marginTop: -8, marginBottom: 16 }}
                >
                  {section.blurb}
                </p>
              )}
              <div className="grid grid-auto">
                {items.map((m, i) => (
                  <ModuleCard key={m.id} m={m} i={i} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
