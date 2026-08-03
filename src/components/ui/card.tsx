"use client";

import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Hairline-ruled block, not a SaaS card (spec §0) — no radius, no shadow.
 * Pass `panel` for the Panel ground used by secondary blocks.
 */
export function Card({
  className,
  panel = false,
  ...props
}: DivProps & { panel?: boolean }) {
  return (
    <div
      className={[
        "border border-df-hairline text-df-body",
        panel ? "bg-df-panel" : "bg-df-paper",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={["flex flex-col gap-2 p-6", className ?? ""].join(" ")} {...props} />;
}

export function CardTitle({ className, ...props }: DivProps) {
  return <div className={["df-h4", className ?? ""].join(" ")} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={["p-6 pt-0", className ?? ""].join(" ")} {...props} />;
}
