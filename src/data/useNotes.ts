/**
 * Small async-query hooks the views use. Keeps loading / error / data in
 * one shape so every view renders the same gentle loader + empty + error
 * states.
 *
 * The fetch runs in an effect keyed on a serialized form of the query, so
 * callers can pass a fresh params object each render without re-fetching.
 */
import { useEffect, useState } from "react";
import type { Note } from "@openparachute/surface-client";
import { queryNotes, getNote, type QueryParams } from "./vault";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const LOADING = { data: null, loading: true, error: null } as const;

export function useNotes(
  params: QueryParams,
  deps: ReadonlyArray<unknown> = [],
): AsyncState<Note[]> {
  const [state, setState] = useState<AsyncState<Note[]>>(LOADING);
  // Serialize so a fresh object each render doesn't re-fire the effect.
  const key = JSON.stringify(params);

  useEffect(() => {
    let alive = true;
    queryNotes(JSON.parse(key) as QueryParams)
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (alive)
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : "Could not reach the vault",
          });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);

  return state;
}

const NO_NOTE = {
  data: null,
  loading: false,
  error: "No note specified",
} as const;

export function useNote(
  idOrPath: string | undefined,
  opts?: { includeLinks?: boolean },
): AsyncState<Note> {
  // Seed the "missing id" case from the initializer so the effect never
  // sets state synchronously.
  const [state, setState] = useState<AsyncState<Note>>(
    idOrPath ? LOADING : NO_NOTE,
  );
  const includeLinks = opts?.includeLinks ?? false;

  useEffect(() => {
    if (!idOrPath) return;
    let alive = true;
    getNote(idOrPath, { includeLinks })
      .then((data) => {
        if (alive)
          setState({
            data,
            loading: false,
            error: data ? null : "Note not found",
          });
      })
      .catch((e: unknown) => {
        if (alive)
          setState({
            data: null,
            loading: false,
            error: e instanceof Error ? e.message : "Could not reach the vault",
          });
      });
    return () => {
      alive = false;
    };
  }, [idOrPath, includeLinks]);

  return state;
}
