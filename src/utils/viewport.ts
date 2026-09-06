import { Viewport } from "../types/viewport";

export type { Viewport };

export interface Point {
  x: number;
  y: number;
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: Viewport,
): Point {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: Viewport,
): Point {
  return {
    x: canvasX * viewport.scale + viewport.x,
    y: canvasY * viewport.scale + viewport.y,
  };
}

export function zoomAtScreenPoint(
  viewport: Viewport,
  screenX: number,
  screenY: number,
  deltaY: number,
  minScale = 0.25,
  maxScale = 4,
): Viewport {
  const zoomFactor = Math.exp(-deltaY * 0.001);
  const nextScale = Math.min(
    maxScale,
    Math.max(minScale, viewport.scale * zoomFactor),
  );

  if (nextScale === viewport.scale) {
    return viewport;
  }

  return {
    scale: nextScale,
    x: screenX - (screenX - viewport.x) * (nextScale / viewport.scale),
    y: screenY - (screenY - viewport.y) * (nextScale / viewport.scale),
  };
}
