import { makeCellKey } from "@/core/types";
import type { CellPos } from "@/core/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTableContext } from "../context/TableContext";
import { useEditSession } from "../hooks/useEditSession";
import { FillHandle } from "./FillHandle";

type CellProps = Readonly<{
  cell: CellPos;
  initialValue: string;
  width: number;
  placeholder?: string;
  align?: "left" | "center" | "right";
  ellipsis?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function Cell({
  cell,
  initialValue,
  width,
  placeholder,
  align,
  ellipsis,
  className,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: CellProps) {
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

  const inputRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  const hasError = session?.status === "error";
  const errorMsg = hasError ? (session?.errors?.[0]?.msg ?? "") : "";
  const inputValue =
    session?.status === "editing" || session?.status === "error"
      ? (session.value ?? initialValue)
      : initialValue;

  // ── Tooltip positioning ──────────────────────────────────────────────
  const showTooltip = useCallback(() => {
    const icon = iconRef.current;
    const tooltip = tooltipRef.current;
    if (!icon || !tooltip || !errorMsg) return;

    tooltip.style.visibility = "hidden";
    tooltip.style.display = "block";
    const tooltipW = tooltip.offsetWidth;
    const tooltipH = tooltip.offsetHeight;
    const iconRect = icon.getBoundingClientRect();

    let left = iconRect.left - tooltipW + iconRect.width;
    if (left < 4) left = 4;
    if (left + tooltipW > window.innerWidth - 4)
      left = window.innerWidth - tooltipW - 4;

    const spaceBelow = window.innerHeight - iconRect.bottom;
    const top =
      spaceBelow >= tooltipH + 6
        ? iconRect.bottom + 4
        : iconRect.top - tooltipH - 4;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.visibility = "visible";
  }, [errorMsg]);

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  }, []);

  // Reactive tooltip: show when error + focused, hide when no error
  useEffect(() => {
    if (hasError && isFocused) showTooltip();
    else hideTooltip();
  }, [hasError, isFocused, showTooltip, hideTooltip]);

  // ── cellRefs registration (for focusCell) ────────────────────────────
  useEffect(() => {
    if (inputRef.current) cellRefs.current?.set(cellKey, inputRef.current);
    return () => {
      cellRefs.current?.delete(cellKey);
    };
  }, [cellKey, cellRefs]);

  // ── Cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      hideTooltip();
      // Keep both 'editing' and 'error' sessions alive across virtual scroll
      // remounts so the user's in-progress value and error state are restored.
    };
  }, [hideTooltip]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isComposingRef.current) return;
      const value = e.target.value;
      editSessionStore.update(cellKey, {
        value,
        status: "editing",
        errors: undefined,
      });
      runSideEffect(cell, value, "change");
    },
    [cellKey, editSessionStore, cell, runSideEffect],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      const value = e.currentTarget.value;
      editSessionStore.update(cellKey, {
        value,
        status: "editing",
        errors: undefined,
      });
      runSideEffect(cell, value, "change");
    },
    [cellKey, editSessionStore, cell, runSideEffect],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setActiveCell(cell);
  }, [cell, setActiveCell]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      hideTooltip();
      commitCell(cell, e.target.value);
    },
    [cell, commitCell, hideTooltip],
  );

  const handleClick = useCallback(() => {
    onCellClick?.(cell.rowId, cell.colKey, inputValue);
  }, [cell.colKey, cell.rowId, inputValue, onCellClick]);

  return (
    <div
      className={className}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      style={{ position: "relative", width, minWidth: width, height: "100%" }}
    >
      <input
        ref={inputRef}
        value={inputValue}
        placeholder={placeholder}
        onClick={handleClick}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={hasError ? "et-input error" : "et-input"}
        aria-invalid={hasError || undefined}
        aria-describedby={
          hasError ? `et-err-${cell.rowId}-${cell.colKey}` : undefined
        }
        style={{
          textAlign: align ?? "left",
          ...(ellipsis
            ? {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }
            : {}),
        }}
      />
      <span
        ref={iconRef}
        className="et-error-icon"
        style={{ display: hasError ? "flex" : "none" }}
        aria-hidden="true"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        !
      </span>
      <div
        ref={tooltipRef}
        id={`et-err-${cell.rowId}-${cell.colKey}`}
        className="et-error-tooltip"
      >
        {errorMsg}
      </div>
      {(isActiveCell ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
