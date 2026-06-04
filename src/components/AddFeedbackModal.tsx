/**
 * Add feedback — paste a feedback/feature-request doc (or load a .txt/.md
 * file), name the reporter, and land it in the vault:
 *
 *   Feedback/raw/<date>-<slug>  → `capture/feedback` (VERBATIM — sacred)
 *   People/<Reporter>           → matched against the roster, or created
 *                                 (relation: user) and linked reported-by.
 *
 * The weave proposes themes/work from there. First of the "many ways to
 * bring feedback in" (Work/brain-feedback-intake).
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { createPortal } from "react-dom";
import { addNoteLinks, createNote, isDemo, queryNotes } from "../data/vault";
import { toPerson } from "../data/model";
import type { Person } from "../data/schema";
import { FEEDBACK_SOURCES } from "../data/schema";
import { label, slugify, todayISO } from "../lib/format";

export function AddFeedbackModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (capturePath: string) => void;
}) {
  const demo = isDemo();
  const [reporter, setReporter] = useState("");
  const [source, setSource] = useState<string>("direct");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Roster for the reporter datalist (and the match-or-create step).
  useEffect(() => {
    if (!open) return;
    let alive = true;
    queryNotes({ tag: "person", include_metadata: "true", limit: "300" })
      .then((notes) => {
        if (alive) setPeople(notes.map(toPerson));
      })
      .catch(() => {
        /* datalist is a nicety; match-or-create still works without it */
      });
    return () => {
      alive = false;
    };
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock the page scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setContent(text);
    if (!title.trim()) setTitle(f.name.replace(/\.(txt|md|markdown)$/i, ""));
  }

  function matchPerson(name: string): Person | undefined {
    const q = name.trim().toLowerCase();
    return people.find(
      (p) =>
        p.title.toLowerCase() === q ||
        (p.path.split("/").pop() ?? "").toLowerCase() === q ||
        (p.aliases ?? []).some((a) => a.toLowerCase() === q),
    );
  }

  async function onSave() {
    const name = reporter.trim();
    if (!name) {
      setError("Who is this from? Name the reporter.");
      return;
    }
    if (!content.trim()) {
      setError("Paste (or load) the feedback first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const date = todayISO();
      // Match the roster, or create the person (relation: user — per the
      // team philosophy, and these are by definition users reaching out).
      const matched = matchPerson(name);
      let personPath = matched?.path;
      if (!personPath) {
        const safeName = name.replace(/[\\/]+/g, "-");
        personPath = `People/${safeName}`;
        await createNote({
          path: personPath,
          tags: ["person"],
          metadata: {
            relation: "user",
            role: "",
            handle: "",
            summary: `Added via feedback intake, ${date}.`,
          },
          content: `# ${name}\n\n(Added via feedback intake, ${date}.)`,
        });
      }
      // The capture — VERBATIM. Only links may ever be added to it.
      const slugBase = title.trim() || `${name} feedback`;
      const capPath = `Feedback/raw/${date}-${slugify(slugBase, "feedback")}`;
      const cap = await createNote({
        path: capPath,
        tags: ["capture/feedback"],
        content,
        metadata: { source, reporter: name },
      });
      try {
        await addNoteLinks(cap.id, [
          { target: personPath, relationship: "reported-by" },
        ]);
      } catch {
        // Non-fatal: metadata.reporter still names them; the weave can
        // propose the link.
      }
      onCreated(capPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the feedback.");
      setBusy(false);
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add feedback"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Add feedback</h2>
        <p className="modal-sub">
          Paste a feedback or feature-request doc (or load a .txt / .md file).
          It lands verbatim, linked to the person — the weave distills themes
          from there.
        </p>

        <div className="field-row">
          <div className="field">
            <label htmlFor="af-reporter">From</label>
            <input
              id="af-reporter"
              type="text"
              list="af-people"
              value={reporter}
              placeholder="Who sent this? (matches the roster, or adds them)"
              onChange={(e) => setReporter(e.target.value)}
            />
            <datalist id="af-people">
              {people.map((p) => (
                <option key={p.id} value={p.title} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="af-source">Source</label>
            <select
              id="af-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {FEEDBACK_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="af-title">Title (optional)</label>
          <input
            id="af-title"
            type="text"
            value={title}
            placeholder="e.g. Feature requests after two weeks of use"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="af-content">The feedback</label>
          <textarea
            id="af-content"
            value={content}
            placeholder="Paste it here, verbatim…"
            onChange={(e) => setContent(e.target.value)}
          />
          <p className="field-hint">
            …or{" "}
            <button
              type="button"
              className="btn-link"
              onClick={() => fileRef.current?.click()}
            >
              load a .txt / .md file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              style={{ display: "none" }}
              onChange={onFile}
            />
          </p>
        </div>

        <div className="modal-actions">
          {error && <span className="modal-error">{error}</span>}
          {demo && !error && (
            <span className="modal-error" style={{ color: "var(--fg-dim)" }}>
              Demo mode — connect to the vault to save real feedback.
            </span>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={onSave}
            disabled={busy || demo}
          >
            {busy ? "Saving…" : "Add feedback"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
