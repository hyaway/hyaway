import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  renderThumb,
  variant = "default",
  ...props
}: SliderPrimitive.Root.Props & {
  /** Custom render function for thumb content. Receives the thumb index. */
  renderThumb?: (index: number) => React.ReactNode;
  /** Visual variant for the slider */
  variant?: "default" | "destructive";
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      className="data-horizontal:w-full data-vertical:h-full"
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control
        className={cn(
          "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
          className,
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="bg-muted relative overflow-hidden rounded-4xl select-none data-horizontal:h-3.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-3.5"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              "transition-colors select-none data-horizontal:h-full data-vertical:w-full",
              variant === "destructive" ? "bg-destructive" : "bg-primary",
            )}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={cn(
              "border-primary ring-ring/50 block size-5 shrink-0 rounded-4xl border bg-white shadow-sm transition-colors select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
              renderThumb && "flex items-center justify-center",
            )}
          >
            {renderThumb?.(index)}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
