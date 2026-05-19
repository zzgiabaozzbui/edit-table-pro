import type { ColKey } from "@/core/types";
import { useRef } from "react";
import { useTableContext } from "../context/TableContext";

export function ResizeHandle({ colKey }: { colKey: ColKey }) {
  const { columnWidths, setColumnWidth } = useTableContext();
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths.get(colKey) ?? 150;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startXRef.current;
      setColumnWidth(colKey, startWidthRef.current + delta);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 4,
        cursor: "col-resize",
        zIndex: 1,
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--et-color-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    />
  );
}
