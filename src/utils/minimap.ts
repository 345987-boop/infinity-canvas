import { Shape } from "../types";

interface CanvasPosition {
  x: number;
  y: number;
}

interface ViewportSize {
  width: number;
  height: number;
}

export interface ContentBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export const getMinimapContentBounds = (
  shapes: Shape[],
  canvasPosition: CanvasPosition,
  scale: number,
  viewportSize: ViewportSize,
): ContentBounds => {
  const viewportMinX = -canvasPosition.x / scale;
  const viewportMaxX =
    viewportMinX + viewportSize.width / scale;

  const viewportMinY = -canvasPosition.y / scale;
  const viewportMaxY =
    viewportMinY + viewportSize.height / scale;

  if (shapes.length === 0) {
    const viewportWorldWidth =
      viewportMaxX - viewportMinX;
    const viewportWorldHeight =
      viewportMaxY - viewportMinY;

    const paddingX = viewportWorldWidth * 0.5;
    const paddingY = viewportWorldHeight * 0.5;

    const minX = viewportMinX - paddingX;
    const maxX = viewportMaxX + paddingX;
    const minY = viewportMinY - paddingY;
    const maxY = viewportMaxY + paddingY;

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    minX = Math.min(minX, shape.x);
    maxX = Math.max(maxX, shape.x + shape.width);
    minY = Math.min(minY, shape.y);
    maxY = Math.max(maxY, shape.y + shape.height);
  });

  const padding = 200;

  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  minX = Math.min(minX, viewportMinX);
  maxX = Math.max(maxX, viewportMaxX);
  minY = Math.min(minY, viewportMinY);
  maxY = Math.max(maxY, viewportMaxY);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};