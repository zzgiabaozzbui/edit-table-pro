import type { EditSessionStore } from "@/core/session";
import type { CellKey, EditSession } from "@/core/types";
import { useSyncExternalStore } from "react";

export function useEditSession(
  store: EditSessionStore,
  key: CellKey,
): EditSession | undefined {
  return useSyncExternalStore(
    store.subscribe,
    () => store.get(key),
    () => store.get(key),
  );
}
