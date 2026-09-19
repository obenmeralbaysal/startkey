import { createElement, type CSSProperties, type ReactNode } from "react";

/**
 * The reference markup puts width/height on `<picture>` as well as on `<img>`.
 * React's picture typings omit those attributes, so they are passed through
 * createElement to keep the same DOM the theme expects.
 */
export function Picture({
  className,
  width,
  height,
  style,
  children,
}: {
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return createElement("picture", { className, width, height, style }, children);
}
