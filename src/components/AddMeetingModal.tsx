/**
 * Add meeting — paste a transcript (Granola export, raw notes…) or load a
 * .txt/.md file, pick the series + date, and land it in the vault:
 *
 *   Meetings/<date>-<slug>             → `meeting` (status: held)
 *   Meetings/<date>-<slug>/transcript  → `capture/text` (raw, sacred)
 *
 * The meeting body wikilinks the transcript (the vault resolves wikilinks
 * into graph edges); the morning weave digests + proposes from there.
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { createPortal } from "react-dom";
import { createNote, isDemo } from "../data/vault";
import { MEETING_SERIES } from "../data/schema";
import { label, todayISO } from "../lib/format";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "meeting"
  );
}

export function AddMeetingModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (meetingPath: string) => void;
}) {
  const demo = isDemo();
  const [title, setTitle] = useState("");
  const [series, setSeries] = useState<string>("ad-hoc");
  const [date, setDate] = useState(() => todayISO());
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock the page scroll while the modal is open (otherwise the page behind
  // scrolls under the overlay — "strange scrolling").
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
    setTranscript(text);
    if (!title.trim()) setTitle(f.name.replace(/\.(txt|md|markdown)$/i, ""));
  }

  async function onSave() {
    if (!title.trim()) {
      setError("Give the meeting a title.");
      return;
    }
    if (!transcript.trim()) {
      setError("Paste (or load) the transcript first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const slug = slugify(title);
      const meetingPath = `Meetings/${date}-${slug}`;
      const transcriptPath = `${meetingPath}/transcript`;
      // The raw transcript first — a sacred capture, verbatim.
      await createNote({
        path: transcriptPath,
        tags: ["capture/text"],
        content: transcript,
        metadata: { source: "paste" },
      });
      // Then the meeting container, wikilinking the transcript.
      await createNote({
        path: meetingPath,
        tags: ["meeting"],
        metadata: { series, held_on: date, status: "held", summary: "" },
        content: `# ${title.trim()}\n\n_${label(series)} — ${date}._ Transcript: [[${transcriptPath}]]\n\n*(Awaiting the weave digest.)*\n`,
      });
      onCreated(meetingPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the meeting.");
      setBusy(false);
    }
  }

  // Portal to <body>: ancestors keep a `transform` after their fade-up
  // entrance (fill-mode: both), and a transformed ancestor becomes the
  // containing block for position:fixed — without the portal the overlay
  // renders as a displaced shaded box instead of covering the viewport.
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add a meeting"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">Add a meeting</h2>
        <p className="modal-sub">
          Paste the transcript (Granola export, raw notes…) or load a .txt /
          .md file. The morning weave digests it from there.
        </p>

        <div className="field">
          <label htmlFor="am-title">Title</label>
          <input
            id="am-title"
            type="text"
            value={title}
            placeholder="e.g. Parachute weekly sync"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="am-series">Series</label>
            <select
              id="am-series"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
            >
              {MEETING_SERIES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="am-date">Held on</label>
            <input
              id="am-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="am-transcript">Transcript</label>
          <textarea
            id="am-transcript"
            value={transcript}
            placeholder="Paste the transcript here…"
            onChange={(e) => setTranscript(e.target.value)}
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
              Demo mode — connect to the vault to save real meetings.
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
            {busy ? "Saving…" : "Add meeting"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
