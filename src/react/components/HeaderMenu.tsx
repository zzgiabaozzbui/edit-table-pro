import { useState } from "react";
import { useTableContext } from "../context/TableContext";

export function HeaderMenu({ colKey }: { colKey: string }) {
  const {
    sortState,
    sortColumn,
    setColumnVisibility,
    setPin,
    effectiveFixed,
    tableProps,
  } = useTableContext();
  const [open, setOpen] = useState(false);
  const L = tableProps.labels;
  const pinned = effectiveFixed(colKey);

  const item = (label: string, action: () => void, key: string) => (
    <button
      key={key}
      type="button"
      role="menuitem"
      onClick={() => {
        action();
        setOpen(false);
      }}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        border: "none",
        background: "transparent",
        padding: "6px 12px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontSize: "var(--et-font-size)",
        color: "inherit",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--et-color-row-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {label}
    </button>
  );

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        aria-label={`Column menu ${colKey}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "0 2px",
          fontSize: 12,
          lineHeight: 1,
          color: "inherit",
        }}
      >
        ⋮
      </button>
      {open && (
        <>
          <div
            role="presentation"
            style={{ position: "fixed", inset: 0, zIndex: 30 }}
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              zIndex: 31,
              background: "var(--et-color-bg)",
              border: "1px solid var(--et-color-border)",
              borderRadius: "var(--et-border-radius)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              minWidth: 140,
              padding: "4px 0",
            }}
          >
            {item(
              L?.sortAsc ?? "Sort ascending",
              () => sortColumn(colKey, "asc"),
              "sa",
            )}
            {item(
              L?.sortDesc ?? "Sort descending",
              () => sortColumn(colKey, "desc"),
              "sd",
            )}
            {item("Clear sort", () => sortColumn(colKey, null), "sc")}
            <div
              style={{
                borderTop: "1px solid var(--et-color-split)",
                margin: "4px 0",
              }}
            />
            {item(L?.pinLeft ?? "Pin left", () => setPin(colKey, "left"), "pl")}
            {item(
              L?.pinRight ?? "Pin right",
              () => setPin(colKey, "right"),
              "pr",
            )}
            {pinned &&
              item(L?.unpin ?? "Unpin", () => setPin(colKey, undefined), "up")}
            <div
              style={{
                borderTop: "1px solid var(--et-color-split)",
                margin: "4px 0",
              }}
            />
            {item(
              L?.hideColumn ?? "Hide column",
              () => setColumnVisibility(colKey, false),
              "hc",
            )}
          </div>
        </>
      )}
    </span>
  );
}
