/**
 * Renders a vault note body with surface-render's NoteRenderer:
 *  - linkComponent  → a react-router <Link> adapter (client-side nav)
 *  - resolve        → maps [[wikilink]] → our /n/<path> route
 *  - fetchBlob      → auth'd media via the live VaultClient (null in demo)
 *  - rehypeHighlight for fenced code
 */
import { Link } from "react-router-dom";
import { NoteRenderer } from "@openparachute/surface-render/note";
import { useVaultFetchBlob } from "@openparachute/surface-render/embed";
import rehypeHighlight from "rehype-highlight";
import type { Note } from "@openparachute/surface-client";
import { surface } from "../data/surface";
import { isDemo } from "../data/vault";

const linkComponent = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: React.ReactNode;
}) => {
  // External links open in a new tab; internal ones route client-side.
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
};

/** [[Some/Path]] → /n/Some/Path. The target IS treated as a note path. */
function resolveWikilink(target: string) {
  const clean = target.trim().replace(/^\[\[|\]\]$/g, "");
  return { href: `/n/${encodeURI(clean)}`, exists: true };
}

/**
 * Drop a single leading `# H1` from markdown when the surface already shows
 * the title in a page header (detail pages) — avoids the title appearing
 * twice. Only strips the very first line if it's an ATX H1.
 */
function withoutLeadingH1(content: string): string {
  const trimmed = content.replace(/^\s+/, "");
  if (trimmed.startsWith("# ")) {
    return trimmed.replace(/^#\s+.*(\r?\n)+/, "");
  }
  return content;
}

export function NoteBody({
  note,
  stripLeadingH1 = false,
}: {
  note: Note;
  stripLeadingH1?: boolean;
}) {
  const client = isDemo() ? null : surface.getClient();
  // surface-render 0.2.0: memoized hook over vaultClientFetchBlob — returns
  // undefined when signed out (demo / not connected).
  const fetchBlob = useVaultFetchBlob(client);

  const rendered =
    stripLeadingH1 && typeof note.content === "string"
      ? { ...note, content: withoutLeadingH1(note.content) }
      : note;

  return (
    <NoteRenderer
      note={rendered}
      linkComponent={linkComponent}
      resolve={resolveWikilink}
      fetchBlob={fetchBlob}
      rehypePlugins={[rehypeHighlight]}
    />
  );
}
