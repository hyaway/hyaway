import { memo, useEffect, useRef } from "react";
import { decode } from "blurhash";
import { cn } from "@/lib/utils";

export interface BlurhashCanvasProps extends React.HTMLAttributes<HTMLCanvasElement> {
  /** The blurhash string to decode and display */
  blurhash: string;
  /** Width of the canvas in pixels (default: 32) */
  width?: number;
  /** Height of the canvas in pixels (default: 32) */
  height?: number;
  /** Number of components to decode on x-axis (default: 4) */
  punch?: number;
}

/**
 * Renders a blurhash string as a canvas element.
 * Uses small dimensions by default since it's just a blur placeholder.
 */
export const BlurhashCanvas = memo(function BlurhashCanvas({
  blurhash,
  width = 32,
  height = 32,
  punch = 1,
  className,
  ...props
}: BlurhashCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !blurhash) return;

    try {
      const pixels = decode(blurhash, width, height, punch);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const imageData = ctx.createImageData(width, height);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      // Invalid blurhash, fail silently
      console.warn("Failed to decode blurhash:", error);
    }
  }, [blurhash, width, height, punch]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("h-full w-full object-cover", className)}
      {...props}
    />
  );
});
