"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

/** Hairline track, square Oxblood thumb — no radius, no shadow (spec §0, §6). */
export function Slider({ className, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={[
        "relative flex w-full touch-none select-none items-center",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[3px] w-full grow overflow-hidden bg-df-hairline">
        <SliderPrimitive.Range className="absolute h-full bg-df-oxblood" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={[
          "block h-3.5 w-3.5 bg-df-oxblood transition-colors duration-df ease-df hover:bg-df-ink",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-df-oxblood",
          "disabled:pointer-events-none disabled:opacity-50",
        ].join(" ")}
      />
    </SliderPrimitive.Root>
  );
}
