import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCellDirty, useTableContext } from "../../context/TableContext";
import { useEditSession } from "../../hooks/useEditSession";
import { FillHandle } from "../FillHandle";

type TextareaCellProps = Readonly<{
  cell: CellPos;
  initialValue: string;
  width: number;
  placeholder?: string;
  align?: "left" | "center" | "right";
  className?: string;
  pinnedStyle?: React.CSSProperties;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

// Fixed-height cell: one flattened line at rest, a floating textarea (CSS :focus) while editing.
export function TextareaCell({
  cell,
  initialValue,
  width,
  placeholder,
  align,
  className,
  pinnedStyle,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: TextareaCellProps) {
  const {
    commitCell,
    editSessionStore,
    cellRefs,
    setActiveCell,
    activeCellState,
    cellSelection,
    runSideEffect,
    onCellClick,
  } = useTableContext();

  const isActiveCell =
    activeCellState?.rowId === cell.rowId &&
    activeCellState?.colKey === cell.colKey;
  const cellKey = makeCellKey(cell.rowId, cell.colKey);
  const session = useEditSession(editSessionStore, cellKey);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isComposingRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = session?.status === "error";
  const inputValue =
    session?.status === "editing" || session?.status === "error"
      ? (session.value ?? initialValue)
      : initialValue;

  useEffect(() => {
    if (inputRef.current) cellRefs.current?.set(cellKey, inputRef.current);
    return () => {
      cellRefs.current?.delete(cellKey);
    };
  }, [cellKey, cellRefs]);

  // An 'editing' session is committed on unmount (virtual scroll, removed row) since blur never fires.
  const latestRef = useRef({ cell, commitCell });
  latestRef.current = { cell, commitCell };
  useEffect(() => {
    return () => {
      const s = editSessionStore.get(cellKey);
      if (s?.status === "editing") {
        void latestRef.current.commitCell(latestRef.current.cell, s.value);
      }
    };
  }, [editSessionStore, cellKey]);

  const edit = useCallback(
    (value: string) => {
      editSessionStore.update(cellKey, {
        value,
        status: "editing",
        errors: undefined,
      });
      runSideEffect(cell, value, "change");
    },
    [cellKey, editSessionStore, cell, runSideEffect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter" || !(e.shiftKey || e.altKey)) return;
      if (isComposingRef.current) return;
      // Alt+Enter inserts nothing natively, so insert the break for both; keep useKeyboardNav from navigating.
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget;
      el.setRangeText("\n", el.selectionStart, el.selectionEnd, "end");
      edit(el.value);
    },
    [edit],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      // Untouched cell: commit the stored value, not the flattened one on screen.
      commitCell(
        cell,
        editSessionStore.get(cellKey) ? e.target.value : initialValue,
      );
    },
    [cell, cellKey, commitCell, editSessionStore, initialValue],
  );

  const dirty = useCellDirty(cell.rowId, cell.colKey);

  return (
    <div
      role="gridcell"
      className={className}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      data-dirty={dirty}
      style={{
        position: "relative",
        width,
        minWidth: width,
        height: "100%",
        ...pinnedStyle,
      }}
    >
      <textarea
        ref={inputRef}
        value={isFocused ? inputValue : inputValue.replace(/\r?\n/g, " ")}
        placeholder={placeholder}
        title={hasError ? (session?.errors?.[0]?.msg ?? "") : undefined}
        onClick={() => onCellClick?.(cell.rowId, cell.colKey, inputValue)}
        onChange={(e) => {
          if (!isComposingRef.current) edit(e.target.value);
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false;
          edit(e.currentTarget.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          setIsFocused(true);
          setActiveCell(cell);
        }}
        className={
          hasError ? "et-input et-textarea error" : "et-input et-textarea"
        }
        aria-invalid={hasError || undefined}
        style={{ textAlign: align ?? "left" }}
      />
      {(isActiveCell ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
