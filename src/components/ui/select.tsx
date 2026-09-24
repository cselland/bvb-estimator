"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

/** Paper ground, 1px Ink border, square corners, 2px Oxblood focus ring (spec §5, §6). */
export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={[
        "flex h-11 w-full items-center justify-between border border-df-ink bg-df-paper px-3 py-2",
        "font-body text-[15px] text-df-ink transition-colors duration-df ease-df",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-df-oxblood",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        {/* Simple Unicode-weight glyph — no icon set (spec §0). */}
        <svg className="h-3 w-3 text-df-ink" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={[
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden border border-df-ink bg-df-paper text-df-ink",
          className ?? "",
        ].join(" ")}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({
  className,
  children,
  hint,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  /** Shown in the open list only, never in the trigger (it sits outside ItemText). */
  hint?: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Item
      className={[
        "relative flex w-full cursor-default select-none items-center py-2 pl-8 pr-3",
        "font-body text-[15px] outline-none transition-colors duration-df ease-df",
        "data-[highlighted]:bg-df-panel data-[highlighted]:text-df-oxblood",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      <span className="absolute left-3 flex h-3 w-3 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <svg className="h-3 w-3 text-df-oxblood" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2 6.5L4.75 9L10 3" stroke="currentColor" strokeWidth="1.75" />
          </svg>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {hint ? <span className="ml-2 df-meta text-[12px]">{hint}</span> : null}
    </SelectPrimitive.Item>
  );
}

export const SelectGroup = SelectPrimitive.Group;

/** Non-selectable section heading inside a Select list. */
export function SelectLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={[
        "px-3 pt-3 pb-1 df-eyebrow text-df-meta",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}

export function SelectSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      className={["my-1 h-px bg-df-hairline", className ?? ""].join(" ")}
      {...props}
    />
  );
}
