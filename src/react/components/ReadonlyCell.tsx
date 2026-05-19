type ReadonlyCellProps = Readonly<{
  value: string;
  width: number;
  align?: "left" | "center" | "right";
  ellipsis?: boolean;
  className?: string;
  "data-colkey"?: string;
  "data-rowid"?: string;
}>;

export function ReadonlyCell({
  value,
  width,
  align,
  ellipsis,
  className,
  "data-colkey": dataColKey,
  "data-rowid": dataRowId,
}: ReadonlyCellProps) {
  return (
    <div
      className={["et-cell-readonly", className].filter(Boolean).join(" ")}
      data-colkey={dataColKey}
      data-rowid={dataRowId}
      style={{
        width,
        minWidth: width,
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--et-padding-x)",
        color: "var(--et-color-text)",
        overflow: "hidden",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        ...(ellipsis
          ? { whiteSpace: "nowrap" as const, textOverflow: "ellipsis" }
          : {}),
      }}
    >
      {value}
    </div>
  );
}
