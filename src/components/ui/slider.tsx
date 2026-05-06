"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

export function Slider({ className, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={[
        "relative flex w-full touch-none select-none items-center",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200">
        <SliderPrimitive.Range className="absolute h-full bg-df-mint" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-df-mint bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-df-mint/30 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}
