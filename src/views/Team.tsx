/**
 * Team — roster grouped by relation (core-team first), each person card with
 * name, role, handle, summary. A small Orgs section beneath.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useNotes } from "../data/useNotes";
import { toOrg, toPerson } from "../data/model";
import { Avatar, Loader, Empty, ErrorBox, Pill } from "../components/ui";
import { PageHeader } from "../components/PageHeader";
import { RELATIONS, relationTint } from "../data/schema";
import { label, noteHref, staggerStyle } from "../lib/format";

const RELATION_LABEL: Record<string, string> = {
  "core-team": "Core team",
  collaborator: "Collaborators",
  advisor: "Advisors",
  investor: "Investors & connectors",
  client: "Clients",
  user: "Users",
  "beta-user": "Beta users",
  friend: "Friends",
};

export function Team() {
  const people = useNotes({
    tag: "person",
    include_metadata: "true",
    limit: "500",
  });
  const orgs = useNotes({ tag: "org", include_metadata: "true", limit: "500" });

  const grouped = useMemo(() => {
    const all = (people.data ?? []).map(toPerson);
    const map = new Map<string, typeof all>();
    for (const r of RELATIONS) map.set(r, []);
    for (const p of all) {
      const r = p.relation ?? "collaborator";
      (map.get(r) ?? map.get("collaborator")!).push(p);
    }
    for (const arr of map.values())
      arr.sort((a, b) => a.title.localeCompare(b.title));
    return map;
  }, [people.data]);

  const orgList = useMemo(() => (orgs.data ?? []).map(toOrg), [orgs.data]);

  if (people.loading || orgs.loading) return <Loader />;
  if (people.error) return <ErrorBox message={people.error} />;

  const activeRelations = RELATIONS.filter(
    (r) => (grouped.get(r)?.length ?? 0) > 0,
  );

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="The people"
        title="Team & circle"
        lead="Everyone in the orbit of the work — core team, the people we build with, and the orgs around us."
      />

      {activeRelations.length === 0 ? (
        <Empty title="No people yet" />
      ) : (
        activeRelations.map((relation) => {
          const items = grouped.get(relation) ?? [];
          return (
            <section key={relation} className="section">
              <div className="section-head">
                <h2 className="section-title">
                  {RELATION_LABEL[relation] ?? label(relation)}
                </h2>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {items.length}
                </span>
              </div>
              <div className="grid grid-auto">
                {items.map((p, i) => (
                  <Link
                    key={p.id}
                    to={noteHref(p.path)}
                    className="card card-hover person-card fade-up"
                    style={staggerStyle(i)}
                  >
                    <Avatar name={p.title} size="lg" />
                    <div style={{ minWidth: 0 }}>
                      <div className="person-name">{p.title}</div>
                      {p.role && (
                        <div className="person-role">{label(p.role)}</div>
                      )}
                      {p.handle && (
                        <div className="person-handle">@{p.handle}</div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <Pill tint={relationTint(p.relation)} dot>
                          {label(p.relation)}
                        </Pill>
                      </div>
                      {p.summary && (
                        <p className="person-summary">{p.summary}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}

      {orgList.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Orgs</h2>
          </div>
          <div className="grid grid-auto">
            {orgList.map((o, i) => (
              <Link
                key={o.id}
                to={noteHref(o.path)}
                className="card card-hover card-pad fade-up"
                style={staggerStyle(i)}
              >
                <div className="person-name">{o.title}</div>
                <div className="work-card-meta" style={{ marginTop: 8 }}>
                  {o.kind && <Pill tint="lavender" dot>{label(o.kind)}</Pill>}
                  {o.affiliation && (
                    <Pill tint="stone">{label(o.affiliation)}</Pill>
                  )}
                </div>
                {o.summary && (
                  <p className="person-summary">{o.summary}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
