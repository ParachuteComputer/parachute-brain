/**
 * The data facade the views call. Two backends behind one interface:
 *
 *  - LIVE  → the surface-client VaultClient (real OAuth'd vault).
 *  - DEMO  → in-memory fixtures (so the surface renders without OAuth).
 *
 * Demo mode is on when `?demo=1` is in the URL or the localStorage flag
 * `pb:demo` is set. Activating via the query param persists the flag so
 * navigation keeps it.
 */
import type {
  Note,
  UpdateNotePayload,
  CreateNotePayload,
} from "@openparachute/surface-client";
import { getLiveClient } from "./surface";
import { ALL_NOTES } from "../demo/fixtures";

const DEMO_KEY = "pb:demo";

export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "1") {
    try {
      window.localStorage.setItem(DEMO_KEY, "1");
    } catch {
      /* ignore */
    }
    return true;
  }
  if (params.get("demo") === "0") {
    try {
      window.localStorage.removeItem(DEMO_KEY);
    } catch {
      /* ignore */
    }
    return false;
  }
  try {
    return window.localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDemo(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(DEMO_KEY, "1");
    else window.localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
}

export interface QueryParams {
  tag?: string;
  tag_match?: string;
  metadata?: string; // JSON-encoded operator object
  path_prefix?: string;
  search?: string;
  sort?: string;
  limit?: string;
  include_metadata?: string;
  include_links?: string;
}

// --------------------------------------------------------------- DEMO impl --

type Op = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "not_in" | "exists";

function matchOp(value: unknown, op: Op, target: unknown): boolean {
  switch (op) {
    case "eq":
      return value === target;
    case "ne":
      return value !== target;
    case "gt":
      return (value as number) > (target as number);
    case "gte":
      return (value as number) >= (target as number);
    case "lt":
      return (value as number) < (target as number);
    case "lte":
      return (value as number) <= (target as number);
    case "in":
      return Array.isArray(target) && target.includes(value);
    case "not_in":
      return Array.isArray(target) && !target.includes(value);
    case "exists":
      return target ? value !== undefined && value !== null : value == null;
    default:
      return true;
  }
}

function tagMatches(note: Note, tag: string): boolean {
  const want = tag.replace(/^#/, "");
  return (note.tags ?? []).some((t) => {
    const clean = t.replace(/^#/, "");
    // tag inheritance: `capture/feedback` matches a `capture` query
    return clean === want || clean.startsWith(want + "/");
  });
}

function demoQuery(params: QueryParams): Note[] {
  let rows = ALL_NOTES.slice();

  if (params.tag) {
    const tags = params.tag.split(",").map((t) => t.trim());
    const matchAll = params.tag_match === "all";
    rows = rows.filter((n) =>
      matchAll
        ? tags.every((t) => tagMatches(n, t))
        : tags.some((t) => tagMatches(n, t)),
    );
  }

  if (params.path_prefix) {
    const p = params.path_prefix;
    rows = rows.filter((n) => (n.path ?? "").startsWith(p));
  }

  if (params.metadata) {
    try {
      const filters = JSON.parse(params.metadata) as Record<
        string,
        Partial<Record<Op, unknown>>
      >;
      rows = rows.filter((n) => {
        const m = n.metadata ?? {};
        return Object.entries(filters).every(([field, ops]) =>
          Object.entries(ops).every(([op, target]) =>
            matchOp(m[field], op as Op, target),
          ),
        );
      });
    } catch {
      /* malformed — ignore filter */
    }
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter(
      (n) =>
        (n.content ?? "").toLowerCase().includes(q) ||
        (n.path ?? "").toLowerCase().includes(q) ||
        JSON.stringify(n.metadata ?? {})
          .toLowerCase()
          .includes(q),
    );
  }

  if (params.sort) {
    const desc = params.sort.startsWith("-");
    const field = desc ? params.sort.slice(1) : params.sort;
    rows.sort((a, b) => {
      const av = sortKey(a, field);
      const bv = sortKey(b, field);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return desc ? -cmp : cmp;
    });
  }

  if (params.limit) {
    const lim = Number(params.limit);
    if (!Number.isNaN(lim)) rows = rows.slice(0, lim);
  }

  return rows.map((n) => ({ ...n }));
}

function sortKey(n: Note, field: string): string | number {
  if (field === "created_at" || field === "createdAt") return n.createdAt;
  if (field === "updated_at" || field === "updatedAt")
    return n.updatedAt ?? n.createdAt;
  const v = (n.metadata ?? {})[field];
  if (typeof v === "number") return v;
  return typeof v === "string" ? v : "";
}

// --------------------------------------------------------------- public API --

export async function queryNotes(params: QueryParams): Promise<Note[]> {
  if (isDemo()) return demoQuery(params);
  const client = getLiveClient();
  if (!client) throw new Error("Not signed in");
  return client.queryNotes(params as Record<string, string>);
}

export async function getNote(
  idOrPath: string,
  opts?: { includeLinks?: boolean },
): Promise<Note | null> {
  if (isDemo()) {
    const n = ALL_NOTES.find(
      (x) => x.id === idOrPath || x.path === idOrPath,
    );
    return n ? { ...n } : null;
  }
  const client = getLiveClient();
  if (!client) throw new Error("Not signed in");
  return client.getNote(idOrPath, opts);
}

export async function createNote(payload: CreateNotePayload): Promise<Note> {
  if (isDemo()) {
    // Optimistic demo: synthesize a created note (not persisted).
    return {
      id: `demo-${Date.now()}`,
      path: payload.path,
      tags: payload.tags,
      metadata: payload.metadata,
      content: payload.content,
      createdAt: new Date().toISOString(),
    };
  }
  const client = getLiveClient();
  if (!client) throw new Error("Not signed in");
  return client.createNote(payload);
}

/**
 * Add graph links to a note. surface-client's UpdateNotePayload doesn't type
 * `links` yet (package gap — the vault REST PATCH accepts `links.add`, same
 * shape the MCP exposes), so this helper owns the cast until it does.
 */
export async function addNoteLinks(
  id: string,
  links: { target: string; relationship: string }[],
): Promise<void> {
  if (isDemo()) return; // demo notes aren't persisted; nothing to link
  const client = getLiveClient();
  if (!client) throw new Error("Not signed in");
  await client.updateNote(id, {
    links: { add: links },
    force: true,
  } as unknown as UpdateNotePayload);
}

export async function updateNote(
  id: string,
  payload: UpdateNotePayload,
): Promise<Note> {
  if (isDemo()) {
    const n = ALL_NOTES.find((x) => x.id === id || x.path === id);
    const merged: Note = {
      id,
      createdAt: n?.createdAt ?? new Date().toISOString(),
      ...(n ?? {}),
      metadata: { ...(n?.metadata ?? {}), ...(payload.metadata ?? {}) },
      content: payload.content ?? n?.content,
      updatedAt: new Date().toISOString(),
    };
    // Mutate the in-memory fixture so the Weave optimistic update sticks
    // across navigation within the session.
    if (n) {
      n.metadata = merged.metadata;
      n.content = merged.content;
      n.updatedAt = merged.updatedAt;
    }
    return merged;
  }
  const client = getLiveClient();
  if (!client) throw new Error("Not signed in");
  return client.updateNote(id, payload);
}
