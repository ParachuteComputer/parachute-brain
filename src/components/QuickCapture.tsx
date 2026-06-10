/**
 * QuickCapture — the drop-a-thought box on Home. A calm, slim affordance:
 * a single-line input that breathes open into a textarea on focus, lands the
 * text VERBATIM as a `capture/text` note under Captures/, and stays out of
 * the way. The morning weave digests captures from there — so the box never
 * navigates anywhere on success; you stay in flow.
 *
 * Attribution is the app-layer convention (no native author column yet):
 * `metadata.author` = the signed-in handle, plus a best-effort `captured-by`
 * graph link to the person's roster note (handle match first, then the
 * title/path-tail fallback mirroring AddFeedbackModal's matchPerson).
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Note } from "@openparachute/surface-client";
import { addNoteLinks, createNote, isDemo, queryNotes } from "../data/vault";
import { toPerson } from "../data/model";
import { signedInHandle } from "../lib/identity";
import { noteHref, slugify } from "../lib/format";

/**
 * Local wall-clock stamp for capture paths: YYYY-MM-DD-HHmmss. Seconds keep
 * two rapid captures with the same opening words from colliding on one path
 * (the vault rejects a duplicate path; the error surfaces, nothing is lost —
 * this just makes the window practically zero).
 */
function localStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(
    d.getHours(),
  )}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * Match a handle against the roster: `metadata.handle` first (the schema's
 * purpose-built field), then the AddFeedbackModal-style title / path-tail /
 * alias fallback.
 */
function matchPerson(notes: Note[], handle: string) {
  const q = handle.trim().toLowerCase();
  const people = notes.map(toPerson);
  return (
    people.find((p) => (p.handle ?? "").toLowerCase() === q) ??
    people.find(
      (p) =>
        p.title.toLowerCase() === q ||
        (p.path.split("/").pop() ?? "").toLowerCase() === q ||
        (p.aliases ?? []).some((a) => a.toLowerCase() === q),
    )
  );
}

export function QuickCapture() {
  const demo = isDemo();
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The just-captured note's path — drives the brief "Captured ✓" line.
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when the box breathes open (it replaces the input,
  // so the focus has to carry over).
  useEffect(() => {
    if (expanded) areaRef.current?.focus();
  }, [expanded]);

  // Remove the "Captured ✓" line after the CSS fade completes. A timer, NOT
  // onAnimationEnd: the prefers-reduced-motion rule collapses animations to
  // ~0ms, which would vanish the confirmation instantly for those users.
  useEffect(() => {
    if (!savedPath) return;
    const t = window.setTimeout(() => setSavedPath(null), 6000);
    return () => window.clearTimeout(t);
  }, [savedPath]);

  async function onCapture() {
    const body = text.trim();
    if (!body || busy || demo) return;
    setBusy(true);
    setError(null);
    try {
      const handle = signedInHandle();
      const slug = slugify(body.split(/\s+/).slice(0, 6).join(" "), "thought");
      const path = `Captures/${localStamp()}-${slug}`;
      const created = await createNote({
        path,
        tags: ["capture/text"],
        content: body,
        metadata: { author: handle ?? "", source: "brain-quick-capture" },
      });
      // Person-link: best-effort, never blocks the capture. metadata.author
      // already names them; the weave can propose the link if this misses.
      if (handle) {
        try {
          const roster = await queryNotes({
            tag: "person",
            include_metadata: "true",
            limit: "300",
          });
          const person = matchPerson(roster, handle);
          if (person) {
            await addNoteLinks(created.id, [
              { target: person.path, relationship: "captured-by" },
            ]);
          }
        } catch {
          /* non-fatal */
        }
      }
      setText("");
      setExpanded(false);
      setSavedPath(created.path ?? path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not capture that.");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void onCapture();
    }
  }

  return (
    <div className="quick-capture fade-up">
      {expanded ? (
        <>
          <textarea
            ref={areaRef}
            className="quick-capture-input"
            value={text}
            placeholder="Drop a thought — the weave will pick it up…"
            aria-label="Quick capture"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (!text.trim() && !busy) setExpanded(false);
            }}
          />
          <div className="quick-capture-foot">
            {error ? (
              <span className="quick-capture-hint quick-capture-error">
                {error}
              </span>
            ) : demo ? (
              <span className="quick-capture-hint">
                Demo mode — connect to the vault to capture real thoughts.
              </span>
            ) : (
              <span className="quick-capture-hint">
                <kbd>⌘</kbd>
                <kbd>↩</kbd> to capture
              </span>
            )}
            <button
              type="button"
              className="btn"
              disabled={busy || demo || !text.trim()}
              onClick={() => void onCapture()}
            >
              {busy ? "Capturing…" : "Capture"}
            </button>
          </div>
        </>
      ) : (
        <input
          type="text"
          className="quick-capture-input"
          value={text}
          placeholder="Drop a thought — the weave will pick it up…"
          aria-label="Quick capture"
          onFocus={() => setExpanded(true)}
          onChange={(e) => {
            setText(e.target.value);
            setExpanded(true);
          }}
        />
      )}
      {savedPath && (
        // Keyed so back-to-back captures restart the hold-then-fade animation.
        <div className="quick-capture-done" key={savedPath} role="status">
          Captured ✓{" "}
          <Link to={noteHref(savedPath)} className="quick-capture-done-link">
            view note
          </Link>
        </div>
      )}
    </div>
  );
}
