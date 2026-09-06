import { useCallback, useEffect, useRef, useState } from "react";
import {
  Point,
  Viewport,
  canvasToScreen,
  screenToCanvas,
  zoomAtScreenPoint,
} from "../utils/viewport";

const DEFAULT_MIN_SCALE = 0.25;
const DEFAULT_MAX_SCALE = 4;

interface UseCanvasViewportOptions {
  initialViewport?: Viewport;
  minScale?: number;
  maxScale?: number;
}

export function useCanvasViewport({
  initialViewport = {
    x: -window.innerWidth,
    y: -window.innerHeight,
    scale: 1,
  },
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
}: UseCanvasViewportOptions = {}) {
  const [viewport, setViewport] = useState<Viewport>(initialViewport);

  /*
   * Latest viewport used by coordinate calculations
   * and transient interactions.
   */
  const viewportRef = useRef<Viewport>(initialViewport);

  /*
   * Indicates that a viewport interaction is currently
   * being handled outside React state.
   *
   * Used so a React render caused by some unrelated
   * state change does not overwrite the transient ref.
   */
  const viewportInteractionRef = useRef(false);

  /*
   * Keep viewportRef synchronized with committed React
   * state when no transient viewport interaction is active.
   */
  useEffect(() => {
    if (!viewportInteractionRef.current) {
      viewportRef.current = viewport;
    }
  }, [viewport]);

  // --------------------------------------------------
  // Normal committed pan
  // --------------------------------------------------

  const panBy = useCallback((dx: number, dy: number) => {
    setViewport((current) => {
      const nextViewport = {
        ...current,
        x: current.x + dx,
        y: current.y + dy,
      };

      viewportRef.current = nextViewport;

      return nextViewport;
    });
  }, []);

  // --------------------------------------------------
  // Transient pan
  // --------------------------------------------------

  const startPan = useCallback(() => {
    viewportInteractionRef.current = true;

    viewportRef.current = {
      ...viewportRef.current,
    };
  }, []);

  const updatePan = useCallback((dx: number, dy: number) => {
    const current = viewportRef.current;

    viewportRef.current = {
      ...current,
      x: current.x + dx,
      y: current.y + dy,
    };
  }, []);

  const commitPan = useCallback(() => {
    const finalViewport = {
      ...viewportRef.current,
    };

    viewportInteractionRef.current = false;

    viewportRef.current = finalViewport;

    setViewport(finalViewport);
  }, []);

  const cancelPan = useCallback(() => {
    viewportInteractionRef.current = false;

    viewportRef.current = {
      ...viewport,
    };
  }, [viewport]);

  // --------------------------------------------------
  // Position
  // --------------------------------------------------

  const setPosition = useCallback((position: Pick<Viewport, "x" | "y">) => {
    setViewport((current) => {
      const nextViewport = {
        ...current,
        ...position,
      };

      viewportRef.current = nextViewport;

      return nextViewport;
    });
  }, []);

  // --------------------------------------------------
  // Scale
  // --------------------------------------------------

  const setScale = useCallback(
    (scale: number) => {
      setViewport((current) => {
        const nextViewport = {
          ...current,
          scale: Math.min(maxScale, Math.max(minScale, scale)),
        };

        viewportRef.current = nextViewport;

        return nextViewport;
      });
    },
    [minScale, maxScale],
  );

  // --------------------------------------------------
  // Normal committed zoom
  // --------------------------------------------------

  const zoomAt = useCallback(
    (screenPoint: Point, deltaY: number) => {
      setViewport((current) => {
        const nextViewport = zoomAtScreenPoint(
          current,
          screenPoint.x,
          screenPoint.y,
          deltaY,
          minScale,
          maxScale,
        );

        viewportRef.current = nextViewport;

        return nextViewport;
      });
    },
    [minScale, maxScale],
  );

  // --------------------------------------------------
  // Transient zoom
  // --------------------------------------------------

  const startZoom = useCallback(() => {
    viewportInteractionRef.current = true;
  }, []);

  const zoomAtTransient = useCallback(
    (screenPoint: Point, deltaY: number) => {
      const current = viewportRef.current;

      const nextViewport = zoomAtScreenPoint(
        current,
        screenPoint.x,
        screenPoint.y,
        deltaY,
        minScale,
        maxScale,
      );

      viewportRef.current = nextViewport;
    },
    [minScale, maxScale],
  );

  const commitZoom = useCallback(() => {
    const finalViewport = {
      ...viewportRef.current,
    };

    viewportInteractionRef.current = false;

    viewportRef.current = finalViewport;

    setViewport(finalViewport);
  }, []);

  const cancelZoom = useCallback(() => {
    viewportInteractionRef.current = false;

    viewportRef.current = {
      ...viewport,
    };
  }, [viewport]);

  // --------------------------------------------------
  // Transient position update
  // --------------------------------------------------

  const updatePositionTransient = useCallback(
    (position: Pick<Viewport, "x" | "y">) => {
      viewportRef.current = {
        ...viewportRef.current,
        ...position,
      };
    },
    [],
  );

  const commitPosition = useCallback(() => {
    const finalViewport = {
      ...viewportRef.current,
    };

    viewportRef.current = finalViewport;
    setViewport(finalViewport);
  }, []);

  // --------------------------------------------------
  // Coordinate conversion
  // --------------------------------------------------

  const toCanvas = useCallback(
    (screenPoint: Point) =>
      screenToCanvas(screenPoint.x, screenPoint.y, viewportRef.current),
    [],
  );

  const toScreen = useCallback(
    (canvasPoint: Point) =>
      canvasToScreen(canvasPoint.x, canvasPoint.y, viewportRef.current),
    [],
  );

  return {
    viewport,
    viewportRef,

    // Existing committed viewport APIs
    panBy,
    setPosition,
    setScale,
    zoomAt,

    // transient pan APIs
    startPan,
    updatePan,
    commitPan,
    cancelPan,

    // transient zoom APIs
    startZoom,
    zoomAtTransient,
    commitZoom,
    cancelZoom,

    updatePositionTransient,
    commitPosition,

    toCanvas,
    toScreen,
  };
}
