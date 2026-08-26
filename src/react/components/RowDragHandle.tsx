import { useRef } from "react";
import { useTableContext } from "../context/TableContext";

export function RowDragHandle({
  rowId,
  rowIndex,
}: {
  rowId: string;
  rowIndex: number;
}) {
  const { scrollContainerRef, rowHeight, setRowDrag, moveRow } =
    useTableContext();
  const targetRef = useRef(rowIndex);

  const computeTarget = (clientY: number): number => {
    const container = scrollContainerRef.current;
    if (!container) return rowIndex;
    const rect = container.getBoundingClientRect();
    const relY = clientY - rect.top + container.scrollTop;
    const total = container.scrollHeight / rowHeight;
    return Math.max(0, Math.min(Math.floor(relY / rowHeight), total - 1));
  };

  return (
    <div
      role="button"
      aria-label="Drag row"
      data-rowid={rowId}
      tabIndex={-1}
      style={{
        flexShrink: 0,
        width: 18,
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--et-color-text)",
        opacity: 0.5,
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // unsupported — drag still works while pressed
        }
        setRowDrag({
          active: true,
          fromIndex: rowIndex,
          targetIndex: rowIndex,
        });
        targetRef.current = rowIndex;

        const btn = e.currentTarget;
        let finished = false;
        const onMove = (ev: PointerEvent) => {
          const t = computeTarget(ev.clientY);
          targetRef.current = t;
          setRowDrag((prev) =>
            prev.targetIndex === t ? prev : { ...prev, targetIndex: t },
          );
        };
        const onUp = () => {
          if (finished) return;
          finished = true;
          btn.removeEventListener("pointermove", onMove);
          btn.removeEventListener("pointerup", onUp);
          btn.removeEventListener("pointercancel", onUp);
          setRowDrag((prev) => ({ ...prev, active: false }));
          moveRow(rowIndex, targetRef.current);
        };
        btn.addEventListener("pointermove", onMove);
        btn.addEventListener("pointerup", onUp);
        btn.addEventListener("pointercancel", onUp);
      }}
    >
      ⠿
    </div>
  );
}
