import type { ColKey } from "@/core/types";
import { useRef } from "react";
import { useTableContext } from "../context/TableContext";

const DEFAULT_WIDTH = 150;
const KEYBOARD_STEP = 16;
const MIN_WIDTH = 40;

export function ResizeHandle({ colKey }: { colKey: ColKey }) {
  const { columnWidths, setColumnWidth } = useTableContext();
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const draggingRef = useRef(false);

  const resizeTo = (width: number) => {
    setColumnWidth(colKey, Math.max(MIN_WIDTH, width));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths.get(colKey) ?? DEFAULT_WIDTH;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture unsupported — dragging still works while pressed
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    resizeTo(startWidthRef.current + (e.clientX - startXRef.current));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = columnWidths.get(colKey) ?? DEFAULT_WIDTH;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation();
      resizeTo(current - KEYBOARD_STEP);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      resizeTo(current + KEYBOARD_STEP);
    } else if (e.key === "Home") {
      e.preventDefault();
      e.stopPropagation();
      resizeTo(DEFAULT_WIDTH);
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize column ${colKey}`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 4,
        cursor: "col-resize",
        zIndex: 1,
        background: "transparent",
        touchAction: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = "var(--et-color-primary)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    />
  );
}
