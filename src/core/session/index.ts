import type { CellKey, EditSession } from "../types";

export class EditSessionStore {
  private map = new Map<CellKey, EditSession>();
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  get(key: CellKey): EditSession | undefined {
    return this.map.get(key);
  }

  set(key: CellKey, session: EditSession): void {
    this.map.get(key)?.abort?.abort();
    this.map.set(key, session);
    this.notify();
  }

  update(key: CellKey, partial: Partial<EditSession>): void {
    const existing = this.map.get(key);
    this.map.set(
      key,
      existing
        ? { ...existing, ...partial }
        : { value: "", status: "editing", ...partial },
    );
    this.notify();
  }

  delete(key: CellKey): void {
    const s = this.map.get(key);
    if (!s) return;
    s.abort?.abort();
    this.map.delete(key);
    this.notify();
  }

  clear(): void {
    for (const s of this.map.values()) s.abort?.abort();
    this.map.clear();
    this.notify();
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }
}
