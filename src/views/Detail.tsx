/**
 * Detail — renders any note by path/id via NoteRenderer, with breadcrumbs,
 * a type-aware metadata panel, and linked notes. Routed at /n/*.
 */
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import type { Note, NoteLink } from "@openparachute/surface-client";
import { useNote } from "../data/useNotes";
import {
  toDecision,
  toFeedbackTheme,
  toMeeting,
  toOrg,
  toPerson,
  toProposal,
  toWork,
  titleOf,
} from "../data/model";
import { NoteBody } from "../components/NoteBody";
import { Avatar, Loader, ErrorBox, Pill, RepoChip } from "../components/ui";
import {
  decisionTint,
  feedbackStatusTint,
  meetingStatusTint,
  priorityTint,
  proposalTint,
  relationTint,
  severityTint,
  workStatusTint,
  categoryTint,
} from "../data/schema";
import { label, fmtDate, ghLinkUrl, noteHref } from "../lib/format";

function primaryTag(note: Note): string {
  const tags = (note.tags ?? []).map((t) => t.replace(/^#/, ""));
  return (
    tags.find(
      (t) =>
        !t.startsWith("repo/") &&
        ["work", "decision", "meeting", "person", "org", "proposal"].some(
          (k) => t === k || t.startsWith(k),
        ),
    ) ??
    tags.find((t) => t.startsWith("feedback")) ??
    tags.find((t) => t.startsWith("summary")) ??
    tags[0] ??
    "note"
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="meta-kv-row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function Detail() {
  const params = useParams();
  // The path is the wildcard remainder after /n/.
  const raw = params["*"] ?? "";
  const idOrPath = decodeURI(raw);
  const { data: note, loading, error } = useNote(idOrPath, {
    includeLinks: true,
  });

  const crumbs = useMemo(() => {
    const segs = idOrPath.split("/").filter(Boolean);
    return segs.slice(0, -1);
  }, [idOrPath]);

  if (loading) return <Loader />;
  if (error || !note) return <ErrorBox message={error ?? "Note not found"} />;

  const tag = primaryTag(note);
  const title = titleOf(note);
  const links = note.links ?? [];

  return (
    <div className="page-enter">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Brain</Link>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "contents" }}>
            <span className="breadcrumb-sep">·</span>
            <span>{c}</span>
          </span>
        ))}
      </nav>

      <div className="detail-head">
        <div className="detail-meta-row">
          <Pill tint="forest" dot>
            {label(tag)}
          </Pill>
        </div>
        <h1 className="detail-title">{title}</h1>
      </div>

      <div className="detail-layout">
        <article>
          {tag === "work" && <TheCallCallout note={note} />}
          <NoteBody note={note} stripLeadingH1 />
        </article>

        <aside className="meta-panel">
          <MetaPanel note={note} tag={tag} />
          <LinkedNotes links={links} selfId={note.id} />
        </aside>
      </div>
    </div>
  );
}

function MetaPanel({ note, tag }: { note: Note; tag: string }) {
  if (tag === "work") return <WorkMeta note={note} />;
  if (tag === "decision") return <DecisionMeta note={note} />;
  if (tag === "meeting") return <MeetingMeta note={note} />;
  if (tag === "person") return <PersonMeta note={note} />;
  if (tag === "org") return <OrgMeta note={note} />;
  if (tag === "proposal") return <ProposalMeta note={note} />;
  if (tag.startsWith("feedback")) return <FeedbackMeta note={note} />;
  return null;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="meta-block">
      <div className="meta-block-title">{title}</div>
      {children}
    </div>
  );
}

/**
 * The "the_call" callout — a calm, prominent statement of the actual decision
 * a needs-decision work arc is waiting on, shown atop the work detail body.
 */
function TheCallCallout({ note }: { note: Note }) {
  const w = toWork(note);
  if (!w.needsDecision && !w.theCall) return null;
  return (
    <div className="call-callout">
      <p className="eyebrow">Waiting on your call</p>
      {w.theCall ? (
        <p className="call-callout-text">{w.theCall}</p>
      ) : (
        <p className="call-callout-text">This arc needs a decision.</p>
      )}
    </div>
  );
}

function WorkMeta({ note }: { note: Note }) {
  const w = toWork(note);
  return (
    <Block title="Work">
      <div className="meta-kv">
        {w.status && (
          <KV
            k="status"
            v={<Pill tint={workStatusTint(w.status)}>{label(w.status)}</Pill>}
          />
        )}
        {w.kind && <KV k="kind" v={label(w.kind)} />}
        {w.priority && (
          <KV
            k="priority"
            v={
              <Pill tint={priorityTint(w.priority)}>{label(w.priority)}</Pill>
            }
          />
        )}
        {w.needsDecision && (
          <KV
            k="decision"
            v={
              <Pill tint="terracotta" dot>
                Needs decision
              </Pill>
            }
          />
        )}
        {w.assignee && (
          <KV
            k="assignee"
            v={
              <span className="assignee">
                <Avatar name={w.assignee} />
                {w.assignee}
              </span>
            }
          />
        )}
        {w.target && <KV k="target" v={w.target} />}
      </div>
      {w.repos.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="meta-block-title">repos</div>
          <div className="work-card-repos">
            {w.repos.map((r) => (
              <Link key={r} to={`/work?repo=${r}`} style={{ textDecoration: "none" }}>
                <RepoChip repo={r} />
              </Link>
            ))}
          </div>
        </div>
      )}
      {w.ghLinks && w.ghLinks.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="meta-block-title">github</div>
          <div className="linked-list">
            {w.ghLinks.map((g) => (
              <a
                key={g}
                className="linked-item mono"
                href={ghLinkUrl(g)}
                target="_blank"
                rel="noreferrer"
              >
                {g}
              </a>
            ))}
          </div>
        </div>
      )}
    </Block>
  );
}

function DecisionMeta({ note }: { note: Note }) {
  const d = toDecision(note);
  return (
    <Block title="Decision">
      <div className="meta-kv">
        {d.status && (
          <KV
            k="status"
            v={<Pill tint={decisionTint(d.status)}>{label(d.status)}</Pill>}
          />
        )}
        {d.scope && (
          <KV k="scope" v={<Pill tint="lavender">{label(d.scope)}</Pill>} />
        )}
        {d.decidedOn && <KV k="decided" v={fmtDate(d.decidedOn)} />}
        {d.supersededBy && <KV k="superseded by" v={d.supersededBy} />}
        {d.supersedes && <KV k="supersedes" v={d.supersedes} />}
      </div>
    </Block>
  );
}

function MeetingMeta({ note }: { note: Note }) {
  const m = toMeeting(note);
  return (
    <Block title="Meeting">
      <div className="meta-kv">
        {m.series && <KV k="series" v={m.series} />}
        {m.heldOn && <KV k="held" v={fmtDate(m.heldOn)} />}
        {m.status && (
          <KV
            k="status"
            v={<Pill tint={meetingStatusTint(m.status)}>{label(m.status)}</Pill>}
          />
        )}
      </div>
    </Block>
  );
}

function PersonMeta({ note }: { note: Note }) {
  const p = toPerson(note);
  return (
    <Block title="Person">
      <div className="meta-kv">
        {p.relation && (
          <KV
            k="relation"
            v={<Pill tint={relationTint(p.relation)}>{label(p.relation)}</Pill>}
          />
        )}
        {p.role && <KV k="role" v={label(p.role)} />}
        {p.handle && <KV k="handle" v={`@${p.handle}`} />}
        {p.contact && <KV k="contact" v={p.contact} />}
      </div>
    </Block>
  );
}

function OrgMeta({ note }: { note: Note }) {
  const o = toOrg(note);
  return (
    <Block title="Org">
      <div className="meta-kv">
        {o.kind && <KV k="kind" v={label(o.kind)} />}
        {o.affiliation && <KV k="affiliation" v={label(o.affiliation)} />}
      </div>
    </Block>
  );
}

function ProposalMeta({ note }: { note: Note }) {
  const p = toProposal(note);
  return (
    <Block title="Proposal">
      <div className="meta-kv">
        {p.status && (
          <KV
            k="status"
            v={<Pill tint={proposalTint(p.status)}>{label(p.status)}</Pill>}
          />
        )}
        {p.kind && <KV k="kind" v={label(p.kind)} />}
        {p.entityType && <KV k="entity type" v={label(p.entityType)} />}
        {typeof p.confidence === "number" && (
          <KV k="confidence" v={`${Math.round(p.confidence * 100)}%`} />
        )}
      </div>
    </Block>
  );
}

function FeedbackMeta({ note }: { note: Note }) {
  const t = toFeedbackTheme(note);
  return (
    <Block title="Feedback theme">
      <div className="meta-kv">
        {t.status && (
          <KV
            k="status"
            v={<Pill tint={feedbackStatusTint(t.status)}>{label(t.status)}</Pill>}
          />
        )}
        {t.category && (
          <KV
            k="category"
            v={<Pill tint={categoryTint(t.category)}>{label(t.category)}</Pill>}
          />
        )}
        {t.severity && (
          <KV
            k="severity"
            v={
              <Pill tint={severityTint(t.severity)}>
                {t.severity.toUpperCase()}
              </Pill>
            }
          />
        )}
      </div>
    </Block>
  );
}

function LinkedNotes({ links, selfId }: { links: NoteLink[]; selfId: string }) {
  if (links.length === 0) return null;
  return (
    <Block title="Linked">
      <div className="linked-list">
        {links.map((l, i) => {
          const other =
            l.sourceId === selfId ? l.targetNote : l.sourceNote;
          const otherId = l.sourceId === selfId ? l.targetId : l.sourceId;
          const path = other?.path ?? otherId;
          const name = other?.path
            ? other.path.split("/").pop()
            : otherId;
          return (
            <Link key={i} to={noteHref(path)} className="linked-item">
              <span className="linked-rel">{l.relationship}</span>
              <div>{name}</div>
            </Link>
          );
        })}
      </div>
    </Block>
  );
}
