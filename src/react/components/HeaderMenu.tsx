import { useState } from "react";
import { useTableContext } from "../context/TableContext";

export function HeaderMenu({ colKey }: { colKey: string }) {
  const {
    columns,
    hiddenColumns,
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
      className="et-menu-item"
      onClick={() => {
        action();
        setOpen(false);
      }}
    >
      {label}
    </button>
  );

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={`Column menu ${colKey}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="et-col-menu-btn"
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M7 2.5h0M7 7h0M7 11.5h0" />
        </svg>
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
          <div role="menu" className="et-menu">
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
            {columns.length > 1 &&
              item(
                L?.hideColumn ?? "Hide column",
                () => setColumnVisibility(colKey, false),
                "hc",
              )}
            {hiddenColumns.map((c) =>
              item(
                `${L?.showColumn ?? "Show"} ${c.header ?? c.key}`,
                () => setColumnVisibility(c.key, true),
                `sc-${c.key}`,
              ),
            )}
          </div>
        </>
      )}
    </span>
  );
}
