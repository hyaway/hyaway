import { use } from "react";
import {
  Slider as PrimitiveSlider,
  SliderOutput as PrimitiveSliderOutput,
  SliderThumb as PrimitiveSliderThumb,
  SliderTrack as PrimitiveSliderTrack,
  SliderStateContext,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import type { SliderProps } from "react-aria-components";
import { cx } from "@/lib/primitive";

export function SliderGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className="flex items-center gap-x-3 *:data-[slot=icon]:size-5"
      {...props}
    />
  );
}

export function Slider({ className, ...props }: SliderProps) {
  return (
    <PrimitiveSlider
      data-slot="control"
      className={cx(
        "group relative flex touch-none flex-col select-none disabled:opacity-50",
        "orientation-horizontal:w-full orientation-horizontal:min-w-fit orientation-horizontal:gap-y-2",
        "orientation-vertical:h-full orientation-vertical:min-h-fit orientation-vertical:w-1.5 orientation-vertical:items-center orientation-vertical:gap-y-2",
        className,
      )}
      {...props}
    />
  );
}

export function SliderOutput({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveSliderOutput>) {
  return (
    <PrimitiveSliderOutput
      className={cx("text-base/6 font-medium sm:text-sm/6", className)}
      {...props}
    />
  );
}

export function SliderThumb({
  className,
  ...props
}: React.ComponentProps<typeof PrimitiveSliderThumb>) {
  return (
    <PrimitiveSliderThumb
      className={cx(
        "border-fg/10 top-[50%] left-[50%] size-[1.25rem] rounded-full border bg-white ring-black outline-hidden transition-[width,height]",
        className,
      )}
      {...props}
    />
  );
}

export function SliderTrack({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PrimitiveSliderTrack>) {
  return (
    <PrimitiveSliderTrack
      className={cx(
        "bg-(--slider-track-bg,var(--color-secondary))",
        "group/track relative cursor-default rounded-full",
        "group-orientation-horizontal:h-1.5 group-orientation-horizontal:w-full group-orientation-vertical:w-1.5 group-orientation-vertical:flex-1 grow",
        "disabled:cursor-default disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {(values) => (
        <>
          {typeof children === "function"
            ? children(values)
            : (children ?? (
                <>
                  <SliderFill />
                  <SliderThumb />
                </>
              ))}
        </>
      )}
    </PrimitiveSliderTrack>
  );
}

export function SliderFill({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const state = use(SliderStateContext);
  const { orientation, getThumbPercent, values } = state || {};

  const getStyle = () => {
    const percent0 = getThumbPercent ? getThumbPercent(0) * 100 : 0;
    const percent1 = getThumbPercent ? getThumbPercent(1) * 100 : 0;

    if (values?.length === 1) {
      return orientation === "horizontal"
        ? { width: `${percent0}%` }
        : { height: `${percent0}%` };
    }

    return orientation === "horizontal"
      ? {
          left: `${percent0}%`,
          width: `${Math.abs(percent0 - percent1)}%`,
        }
      : {
          bottom: `${percent0}%`,
          height: `${Math.abs(percent0 - percent1)}%`,
        };
  };

  return (
    <div
      {...props}
      style={getStyle()}
      className={twMerge(
        "group-orientation-horizontal/top-0 bg-primary group-orientation-vertical/track:bottom-0 group-orientation-horizontal/track:h-full group-orientation-vertical/track:w-full pointer-events-none absolute rounded-full group-disabled/track:opacity-60",
        className,
      )}
    />
  );
}
