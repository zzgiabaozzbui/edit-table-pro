import { makeCellKey } from "@/core/types";
import type { CellPos, ColDef } from "@/core/types";
import { useCallback } from "react";
import { useCellDirty, useTableContext } from "../../context/TableContext";
import { useEditSession } from "../../hooks/useEditSession";
import { FillHandle } from "../FillHandle";

type EditorCellProps<T> = Readonly<{
  cell: CellPos;
  value: string;
  renderEditor: NonNullable<ColDef<T>["renderEditor"]>;
  row: T;
  rowIndex: number;
  width: number;
  disabled: boolean;
  className?: string;
  pinnedStyle?: React.CSSProperties;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function EditorCell<T>({
  cell,
  value,
  renderEditor,
  row,
  rowIndex,
  width,
  disabled,
  className,
  pinnedStyle,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: EditorCellProps<T>) {
  const {
    commitCell,
    editSessionStore,
    cellRefs,
    setActiveCell,
    activeCellState,
    cellSelection,
  } = useTableContext();

  const cellKey = makeCellKey(cell.rowId, cell.colKey);
  const session = useEditSession(editSessionStore, cellKey);
  const isError = session?.status === "error";
  const dirty = useCellDirty(cell.rowId, cell.colKey);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (el) cellRefs.current?.set(cellKey, el);
      else cellRefs.current?.delete(cellKey);
    },
    [cellKey, cellRefs],
  );

  return (
    <div
      role="gridcell"
      className={className}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      data-dirty={dirty}
      onFocusCapture={() => setActiveCell(cell)}
      style={{
        position: "relative",
        width,
        minWidth: width,
        height: "100%",
        ...pinnedStyle,
      }}
    >
      {renderEditor(isError ? session.value : value, {
        row,
        rowIndex,
        disabled,
        error: isError ? session.errors?.[0]?.msg : undefined,
        ref,
        commit: (v) => {
          if (!disabled) void commitCell(cell, v);
        },
        cancel: () => editSessionStore.delete(cellKey),
      })}
      {((activeCellState?.rowId === cell.rowId &&
        activeCellState?.colKey === cell.colKey) ||
        (cellSelection?.rowId === cell.rowId &&
          cellSelection?.colKeyEnd === cell.colKey)) && (
        <FillHandle rowId={cell.rowId} colKey={cell.colKey} />
      )}
    </div>
  );
}
