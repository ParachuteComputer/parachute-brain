/**
 * The page header — eyebrow, serif title, and an optional calm lead. The
 * recurring "settling" entrance moment at the top of every view.
 */
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="page-enter" style={{ marginBottom: 32 }}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {lead && (
        <p className="lead" style={{ marginTop: 14, maxWidth: "60ch" }}>
          {lead}
        </p>
      )}
      {children}
    </div>
  );
}
