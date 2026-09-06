import { useCallback, useRef, useState } from "react";
import { Shape } from "../types";

type CanvasPoint = {
  x: number;
  y: number;
};

export type DrawingGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DrawingState = {
  shapeId: string | null;
  start: CanvasPoint;
};

type UseCanvasDrawingOptions = {
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  getShapeElement: (shapeId: string) => HTMLDivElement | null;

  /*
   * Called from the drawing rAF after the
   * latest transient geometry has been
   * calculated.
   *
   * This does NOT update React state.
   */
  onTransientDrawingChange?: (
    shapeId: string,
    geometry: DrawingGeometry,
  ) => void;
};

export function useCanvasDrawing({
  shapes,
  setShapes,
  getShapeElement,
  onTransientDrawingChange,
}: UseCanvasDrawingOptions) {
  const drawingState = useRef<DrawingState>({
    shapeId: null,
    start: {
      x: 0,
      y: 0,
    },
  });

  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);

  // Latest pointer position.
  const drawingPoint = useRef<CanvasPoint | null>(null);

  // Latest calculated geometry.
  const drawingGeometry = useRef<DrawingGeometry | null>(null);

  // Pending animation frame.
  const drawingUpdateRef = useRef<number | null>(null);

  const startDrawing = useCallback((shapeId: string, start: CanvasPoint) => {
    drawingState.current = {
      shapeId,
      start,
    };

    drawingPoint.current = start;

    drawingGeometry.current = {
      x: start.x,
      y: start.y,
      width: 0,
      height: 0,
    };

    setDrawingShapeId(shapeId);
  }, []);

  const updateDrawing = useCallback(
    (canvasCoords: CanvasPoint) => {
      const shapeId = drawingState.current.shapeId;

      if (!shapeId) {
        return;
      }

      drawingPoint.current = canvasCoords;

      /*
       * Coalesce pointer events.
       */
      if (drawingUpdateRef.current !== null) {
        return;
      }

      drawingUpdateRef.current = requestAnimationFrame(() => {
        drawingUpdateRef.current = null;

        const point = drawingPoint.current;

        if (!point) {
          return;
        }

        const start = drawingState.current.start;

        const width = Math.abs(point.x - start.x);

        const height = Math.abs(point.y - start.y);

        const x = Math.min(point.x, start.x);

        const y = Math.min(point.y, start.y);

        const geometry: DrawingGeometry = {
          x,
          y,
          width,
          height,
        };

        drawingGeometry.current = geometry;

        const element = getShapeElement(shapeId);

        if (element) {
          /*
           * Main canvas:
           * direct DOM update.
           */
          element.style.left = `${x}px`;

          element.style.top = `${y}px`;

          element.style.width = `${width}px`;

          element.style.height = `${height}px`;
        }

        /*
         * Minimap:
         * direct DOM update through
         * the callback.
         *
         * No React state.
         */
        onTransientDrawingChange?.(shapeId, geometry);
      });
    },
    [getShapeElement, onTransientDrawingChange],
  );

  const finishDrawing = useCallback(() => {
    const shapeId = drawingState.current.shapeId;

    if (!shapeId) {
      return;
    }

    /*
     * The final pending frame is no longer
     * needed because we commit the latest
     * calculated geometry ourselves.
     */
    if (drawingUpdateRef.current !== null) {
      cancelAnimationFrame(drawingUpdateRef.current);

      drawingUpdateRef.current = null;
    }

    const finalGeometry = drawingGeometry.current;

    if (!finalGeometry) {
      drawingState.current = {
        shapeId: null,
        start: {
          x: 0,
          y: 0,
        },
      };

      drawingPoint.current = null;

      setDrawingShapeId(null);

      return shapeId;
    }

    /*
     * Single React commit for the final
     * drawing geometry.
     */
    if (finalGeometry.width <= 5 || finalGeometry.height <= 5) {
      setShapes((prev) => prev.filter((shape) => shape.id !== shapeId));
    } else {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === shapeId
            ? {
                ...shape,
                x: finalGeometry.x,
                y: finalGeometry.y,
                width: finalGeometry.width,
                height: finalGeometry.height,
              }
            : shape,
        ),
      );
    }

    drawingState.current = {
      shapeId: null,
      start: {
        x: 0,
        y: 0,
      },
    };

    drawingPoint.current = null;

    drawingGeometry.current = null;

    setDrawingShapeId(null);

    return shapeId;
  }, [setShapes]);

  const isDrawing = useCallback(() => {
    return drawingState.current.shapeId !== null;
  }, []);

  return {
    startDrawing,
    updateDrawing,
    finishDrawing,
    isDrawing,
    drawingShapeId,
  };
}
