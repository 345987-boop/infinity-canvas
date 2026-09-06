import React, {
  useRef,
  useCallback,
  useMemo,
  useImperativeHandle,
  useLayoutEffect,
  forwardRef,
} from "react";
import { Shape } from "../types";
import { getMinimapContentBounds } from "../utils/minimap";

export interface MinimapHandle {
  updateTransientViewport: (viewport: {
    x: number;
    y: number;
    scale: number;
  }) => void;

  updateTransientShape: (
    shapeId: string,
    geometry: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ) => void;
}

interface MinimapProps {
  shapes: Shape[];

  canvasPosition: {
    x: number;
    y: number;
  };

  scale: number;

  onPositionChange: (position: { x: number; y: number }) => void;

  onTransientPositionChange: (position: { x: number; y: number }) => void;

  onPositionCommit: () => void;

  viewportSize: {
    width: number;
    height: number;
  };
}

const Minimap = forwardRef<MinimapHandle, MinimapProps>(function Minimap(
  {
    shapes,
    canvasPosition,
    scale,
    onPositionChange,
    onTransientPositionChange,
    onPositionCommit,
    viewportSize,
  },
  ref,
) {
  // --------------------------------------------------
  // DOM refs
  // --------------------------------------------------

  const minimapRef = useRef<HTMLDivElement>(null);

  const minimapViewportRef = useRef<HTMLDivElement>(null);

  const minimapShapeElements = useRef(new Map<string, HTMLDivElement>());

  // --------------------------------------------------
  // Minimap drag refs
  // --------------------------------------------------

  const isDraggingViewport = useRef(false);

  const dragStart = useRef({
    x: 0,
    y: 0,
  });

  const dragStartCanvasPosition = useRef({
    x: 0,
    y: 0,
  });

  const pendingPosition = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const animationFrame = useRef<number | null>(null);

  // --------------------------------------------------
  // Size
  // --------------------------------------------------

  const minimapSize = useMemo(
    () => ({
      width: viewportSize.width * 0.15,

      height: viewportSize.height * 0.15,
    }),
    [viewportSize.width, viewportSize.height],
  );

  // --------------------------------------------------
  // Committed minimap calculations
  // --------------------------------------------------

  const contentBounds = useMemo(
    () => getMinimapContentBounds(shapes, canvasPosition, scale, viewportSize),
    [shapes, canvasPosition, scale, viewportSize],
  );

  const sortedShapes = useMemo(
    () => [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [shapes],
  );

  const viewportMinX = -canvasPosition.x / scale;

  const viewportMinY = -canvasPosition.y / scale;

  const minimapScale = Math.min(
    minimapSize.width / contentBounds.width,

    minimapSize.height / contentBounds.height,
  );

  // --------------------------------------------------
  // Center committed content inside minimap
  // --------------------------------------------------

  const minimapOffsetX =
    (minimapSize.width - contentBounds.width * minimapScale) / 2;

  const minimapOffsetY =
    (minimapSize.height - contentBounds.height * minimapScale) / 2;

  useLayoutEffect(() => {
    const element = minimapViewportRef.current;

    if (!element) {
      return;
    }

    const left =
      minimapOffsetX + (viewportMinX - contentBounds.minX) * minimapScale;

    const top =
      minimapOffsetY + (viewportMinY - contentBounds.minY) * minimapScale;

    const width = (viewportSize.width / scale) * minimapScale;

    const height = (viewportSize.height / scale) * minimapScale;

    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.transform = "none";
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;

    minimapShapeElements.current.forEach((shapeElement) => {
      shapeElement.style.transform = "none";
    });
  }, [
    minimapOffsetX,
    minimapOffsetY,
    viewportMinX,
    viewportMinY,
    contentBounds.minX,
    minimapScale,
    viewportSize.width,
    viewportSize.height,
    scale,
    contentBounds.minY,
    shapes,
  ]);

  // --------------------------------------------------
  // Transient viewport
  // --------------------------------------------------

  const updateTransientViewport = useCallback(
    (transientViewport: { x: number; y: number; scale: number }) => {
      const element = minimapViewportRef.current;

      if (!element) {
        return;
      }

      const transientViewportMinX =
        -transientViewport.x / transientViewport.scale;

      const transientViewportMinY =
        -transientViewport.y / transientViewport.scale;

      const left =
        minimapOffsetX +
        (transientViewportMinX - contentBounds.minX) * minimapScale;

      const top =
        minimapOffsetY +
        (transientViewportMinY - contentBounds.minY) * minimapScale;

      const width =
        (viewportSize.width / transientViewport.scale) * minimapScale;

      const height =
        (viewportSize.height / transientViewport.scale) * minimapScale;

      const committedLeft =
        minimapOffsetX + (viewportMinX - contentBounds.minX) * minimapScale;
      const committedTop =
        minimapOffsetY + (viewportMinY - contentBounds.minY) * minimapScale;

      element.style.transform = `translate3d(${left - committedLeft}px, ${
        top - committedTop
      }px, 0)`;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
    },
    [
      contentBounds.minX,
      contentBounds.minY,
      minimapScale,
      minimapOffsetX,
      minimapOffsetY,
      viewportSize.width,
      viewportMinX,
      viewportMinY,
      viewportSize.height,
    ],
  );

  // --------------------------------------------------
  // Transient shape
  // --------------------------------------------------

  const updateTransientShape = useCallback(
    (
      shapeId: string,
      geometry: {
        x: number;
        y: number;
        width: number;
        height: number;
      },
    ) => {
      const element = minimapShapeElements.current.get(shapeId);

      if (!element) {
        return;
      }

      /*
       * Shape dragging continues to use
       * the committed minimap coordinate
       * system.
       *
       * This preserves the working live
       * shape → minimap synchronization.
       */

      const left =
        minimapOffsetX + (geometry.x - contentBounds.minX) * minimapScale;
      const top =
        minimapOffsetY + (geometry.y - contentBounds.minY) * minimapScale;
      const committedShape = shapes.find((shape) => shape.id === shapeId);

      if (committedShape) {
        const committedLeft =
          minimapOffsetX +
          (committedShape.x - contentBounds.minX) * minimapScale;
        const committedTop =
          minimapOffsetY +
          (committedShape.y - contentBounds.minY) * minimapScale;

        element.style.transform = `translate3d(${
          left - committedLeft
        }px, ${top - committedTop}px, 0)`;
      }

      element.style.width = `${geometry.width * minimapScale}px`;

      element.style.height = `${geometry.height * minimapScale}px`;
    },
    [
      contentBounds.minX,
      contentBounds.minY,
      minimapScale,
      minimapOffsetX,
      minimapOffsetY,
      shapes,
    ],
  );

  // --------------------------------------------------
  // Expose imperative visual API
  // --------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      updateTransientViewport,
      updateTransientShape,
    }),
    [updateTransientViewport, updateTransientShape],
  );

  // --------------------------------------------------
  // Minimap click
  // --------------------------------------------------

  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!minimapRef.current) {
        return;
      }

      if (isDraggingViewport.current) {
        return;
      }

      const rect = minimapRef.current.getBoundingClientRect();

      /*
       * Convert from minimap coordinates
       * back into world coordinates.
       */

      const minimapX = e.clientX - rect.left - minimapOffsetX;

      const minimapY = e.clientY - rect.top - minimapOffsetY;

      const canvasX = contentBounds.minX + minimapX / minimapScale;

      const canvasY = contentBounds.minY + minimapY / minimapScale;

      /*
       * Center the clicked world point
       * in the actual viewport.
       */

      const newPosition = {
        x: viewportSize.width / 2 - canvasX * scale,

        y: viewportSize.height / 2 - canvasY * scale,
      };

      onPositionChange(newPosition);
    },
    [
      contentBounds,
      minimapScale,
      minimapOffsetX,
      minimapOffsetY,
      viewportSize,
      scale,
      onPositionChange,
    ],
  );

  // --------------------------------------------------
  // Apply viewport visual
  // --------------------------------------------------

  const applyViewportVisual = useCallback(
    (position: { x: number; y: number }) => {
      updateTransientViewport({
        x: position.x,
        y: position.y,
        scale,
      });
    },
    [updateTransientViewport, scale],
  );

  // --------------------------------------------------
  // rAF minimap drag update
  // --------------------------------------------------

  const scheduleVisualUpdate = useCallback(() => {
    if (animationFrame.current !== null) {
      return;
    }

    animationFrame.current = requestAnimationFrame(() => {
      animationFrame.current = null;

      const position = pendingPosition.current;

      if (!position) {
        return;
      }

      applyViewportVisual(position);

      onTransientPositionChange(position);
    });
  }, [applyViewportVisual, onTransientPositionChange]);

  // --------------------------------------------------
  // Minimap viewport drag
  // --------------------------------------------------

  const handleViewportMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      isDraggingViewport.current = true;

      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
      };

      dragStartCanvasPosition.current = {
        x: canvasPosition.x,
        y: canvasPosition.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingViewport.current) {
          return;
        }

        const deltaX = moveEvent.clientX - dragStart.current.x;

        const deltaY = moveEvent.clientY - dragStart.current.y;

        const worldDeltaX = deltaX / minimapScale;

        const worldDeltaY = deltaY / minimapScale;

        const newPosition = {
          x: dragStartCanvasPosition.current.x - worldDeltaX * scale,

          y: dragStartCanvasPosition.current.y - worldDeltaY * scale,
        };

        pendingPosition.current = newPosition;

        scheduleVisualUpdate();
      };

      const handleMouseUp = () => {
        isDraggingViewport.current = false;

        if (animationFrame.current !== null) {
          cancelAnimationFrame(animationFrame.current);

          animationFrame.current = null;
        }

        const finalPosition = pendingPosition.current;

        if (finalPosition) {
          applyViewportVisual(finalPosition);

          onTransientPositionChange(finalPosition);

          pendingPosition.current = null;
        }

        onPositionCommit();

        document.removeEventListener("mousemove", handleMouseMove);

        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);

      document.addEventListener("mouseup", handleMouseUp);
    },
    [
      canvasPosition,
      minimapScale,
      scale,
      scheduleVisualUpdate,
      applyViewportVisual,
      onTransientPositionChange,
      onPositionCommit,
    ],
  );

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  React.useEffect(() => {
    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div
      className="minimap-container"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
      }}
    >
      <div
        ref={minimapRef}
        className="minimap"
        style={{
          position: "relative",

          width: minimapSize.width,

          height: minimapSize.height,

          overflow: "hidden",
        }}
        onClick={handleMinimapClick}
      >
        {sortedShapes.map((shape) => (
          <div
            key={shape.id}
            ref={(element) => {
              if (element) {
                minimapShapeElements.current.set(shape.id, element);
              } else {
                minimapShapeElements.current.delete(shape.id);
              }
            }}
            className={`minimap-shape minimap-shape-${shape.type}`}
            style={{
              position: "absolute",

              left:
                minimapOffsetX + (shape.x - contentBounds.minX) * minimapScale,

              top:
                minimapOffsetY + (shape.y - contentBounds.minY) * minimapScale,

              width: shape.width * minimapScale,

              height: shape.height * minimapScale,

              borderRadius: "2px",

              backgroundColor: shape.color,

              borderColor: shape.color,

              zIndex: shape.zIndex,
            }}
          />
        ))}

        <div
          ref={minimapViewportRef}
          className="minimap-viewport"
          style={{
            position: "absolute",

            /*
             * Keep border inside the
             * calculated rectangle.
             */

            boxSizing: "border-box",

            left:
              minimapOffsetX +
              (viewportMinX - contentBounds.minX) * minimapScale,

            top:
              minimapOffsetY +
              (viewportMinY - contentBounds.minY) * minimapScale,

            width: (viewportSize.width / scale) * minimapScale,

            height: (viewportSize.height / scale) * minimapScale,

            border: "2px solid white",

            backgroundColor: "transparent",

            pointerEvents: "auto",

            cursor: "grab",

            zIndex: 1000,
          }}
          onMouseDown={handleViewportMouseDown}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
});

export default Minimap;
