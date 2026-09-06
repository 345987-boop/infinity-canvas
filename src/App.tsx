import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import "./App.css";
import Toolbar from "./components/Toolbar";
import Minimap, { MinimapHandle } from "./components/Minimap";
import ShapeView from "./components/ShapeView";
import { Shape } from "./types";
import { getRandomColor } from "./utils/colors";
import { useCanvasViewport, useCanvasDrawing } from "./hooks";
import type { DrawingGeometry } from "./hooks/useCanvasDrawing";

type Mode = "pan" | "draw";

function App() {
  const [isDragging, setIsDragging] = useState(false);

  const lastCursorPos = useRef({
    x: 0,
    y: 0,
  });

  const dragOffset = useRef({
    x: 0,
    y: 0,
  });

  // --------------------------------------------------
  // Shape drag transient state
  // --------------------------------------------------

  const dragPosition = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const dragFrame = useRef<number | null>(null);

  // --------------------------------------------------
  // Shape DOM registry
  // --------------------------------------------------

  const shapeElements = useRef(new Map<string, HTMLDivElement>());

  const [shapes, setShapes] = useState<Shape[]>([]);

  const shapesRef = useRef(shapes);

  shapesRef.current = shapes;

  const [draggingShape, setDraggingShape] = useState<string | null>(null);

  // --------------------------------------------------
  // Mode
  // --------------------------------------------------

  const [mode, setMode] = useState<Mode>("pan");

  const modeRef = useRef<Mode>(mode);

  modeRef.current = mode;

  // --------------------------------------------------
  // Canvas DOM
  // --------------------------------------------------

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const canvasContentRef = useRef<HTMLDivElement | null>(null);

  const minimapRef = useRef<MinimapHandle | null>(null);

  // --------------------------------------------------
  // Viewport frames
  // --------------------------------------------------

  const panFrame = useRef<number | null>(null);

  const zoomFrame = useRef<number | null>(null);

  // --------------------------------------------------
  // Auto-pan
  // --------------------------------------------------

  const isAutoPanning = useRef(false);

  // --------------------------------------------------
  // Zoom commit debounce
  // --------------------------------------------------

  const zoomCommitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --------------------------------------------------
  // Shape DOM helpers
  // --------------------------------------------------

  const registerShapeElement = useCallback(
    (shapeId: string, element: HTMLDivElement | null) => {
      if (element) {
        shapeElements.current.set(shapeId, element);
      } else {
        shapeElements.current.delete(shapeId);
      }
    },
    [],
  );

  const getShapeElement = useCallback((shapeId: string) => {
    return shapeElements.current.get(shapeId) ?? null;
  }, []);

  // --------------------------------------------------
  // Drawing → live minimap
  // --------------------------------------------------

  const handleTransientDrawingChange = useCallback(
    (shapeId: string, geometry: DrawingGeometry) => {
      minimapRef.current?.updateTransientShape(shapeId, geometry);
    },
    [],
  );

  // --------------------------------------------------
  // Drawing
  // --------------------------------------------------

  const {
    startDrawing,
    updateDrawing,
    finishDrawing,
    isDrawing,
    drawingShapeId,
  } = useCanvasDrawing({
    shapes,
    setShapes,
    getShapeElement,
    onTransientDrawingChange: handleTransientDrawingChange,
  });

  // --------------------------------------------------
  // Viewport
  // --------------------------------------------------

  const {
    viewport,
    viewportRef,

    startPan,
    updatePan,
    commitPan,
    // cancelPan,

    startZoom,
    zoomAtTransient,
    commitZoom,

    updatePositionTransient,
    commitPosition,

    setPosition,
    toCanvas,
  } = useCanvasViewport();

  // --------------------------------------------------
  // Coordinate conversion
  // --------------------------------------------------

  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      return toCanvas({
        x: clientX,
        y: clientY,
      });
    },
    [toCanvas],
  );

  // --------------------------------------------------
  // Main canvas visual update
  // --------------------------------------------------

  const applyViewportVisual = useCallback(() => {
    const element = canvasContentRef.current;

    if (!element) {
      return;
    }

    const currentViewport = viewportRef.current;

    element.style.transform =
      `translate(${currentViewport.x}px, ${currentViewport.y}px) ` +
      `scale(${currentViewport.scale})`;
  }, [viewportRef]);

  // --------------------------------------------------
  // Pan visual update
  // --------------------------------------------------

  const schedulePanVisual = useCallback(() => {
    if (panFrame.current !== null) {
      return;
    }

    panFrame.current = requestAnimationFrame(() => {
      panFrame.current = null;

      const currentViewport = viewportRef.current;

      /*
       * Main canvas.
       */
      applyViewportVisual();

      /*
       * Minimap viewport.
       */
      minimapRef.current?.updateTransientViewport(currentViewport);
    });
  }, [applyViewportVisual, viewportRef]);

  // --------------------------------------------------
  // Zoom visual update
  // --------------------------------------------------

  const scheduleZoomVisual = useCallback(() => {
    if (zoomFrame.current !== null) {
      return;
    }

    zoomFrame.current = requestAnimationFrame(() => {
      zoomFrame.current = null;

      const currentViewport = viewportRef.current;

      /*
       * Main canvas.
       */
      applyViewportVisual();

      /*
       * Minimap viewport.
       */
      minimapRef.current?.updateTransientViewport(currentViewport);
    });
  }, [applyViewportVisual, viewportRef]);

  // --------------------------------------------------
  // Shape drag visual update
  // --------------------------------------------------

  const applyDragVisual = useCallback(() => {
    if (draggingShape === null) {
      return;
    }

    const position = dragPosition.current;

    if (!position) {
      return;
    }

    const shape = shapesRef.current.find((item) => item.id === draggingShape);

    const element = shapeElements.current.get(draggingShape);

    if (!shape || !element) {
      return;
    }

    const deltaX = position.x - shape.x;

    const deltaY = position.y - shape.y;

    /*
     * Main canvas shape.
     */
    element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

    /*
     * Minimap shape.
     */
    minimapRef.current?.updateTransientShape(draggingShape, {
      x: position.x,
      y: position.y,
      width: shape.width,
      height: shape.height,
    });
  }, [draggingShape]);

  const scheduleDragVisual = useCallback(() => {
    if (dragFrame.current !== null) {
      return;
    }

    dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null;

      applyDragVisual();
    });
  }, [applyDragVisual]);

  // --------------------------------------------------
  // Shape pointer down
  // --------------------------------------------------

  const handleShapePointerDown = useCallback(
    (e: React.PointerEvent, shapeId: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (modeRef.current === "draw") {
        return;
      }

      const pointerCanvasPosition = getCanvasCoordinates(e.clientX, e.clientY);

      const shape = shapesRef.current.find((item) => item.id === shapeId);

      if (!shape) {
        return;
      }

      setDraggingShape(shapeId);

      setShapes((prev) => {
        const maxZ = Math.max(0, ...prev.map((s) => s.zIndex));

        return prev.map((item) =>
          item.id === shapeId
            ? {
                ...item,
                zIndex: maxZ + 1,
              }
            : item,
        );
      });

      dragOffset.current = {
        x: pointerCanvasPosition.x - shape.x,

        y: pointerCanvasPosition.y - shape.y,
      };

      dragPosition.current = {
        x: shape.x,
        y: shape.y,
      };

      isAutoPanning.current = false;
    },
    [getCanvasCoordinates],
  );

  // --------------------------------------------------
  // Canvas pointer down
  // --------------------------------------------------

  const handleMouseDown = useCallback(
    (e: React.PointerEvent) => {
      if (modeRef.current === "draw") {
        const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);

        const newShapeId = `drawing-${Date.now()}`;

        const newColor = getRandomColor();

        const newShape: Shape = {
          id: newShapeId,
          type: "rectangle",
          x: canvasCoords.x,
          y: canvasCoords.y,
          width: 0,
          height: 0,
          color: newColor,
          zIndex:
            shapesRef.current.length > 0
              ? Math.max(...shapesRef.current.map((s) => s.zIndex)) + 1
              : 1,
        };

        setShapes((prev) => [...prev, newShape]);

        startDrawing(newShapeId, canvasCoords);

        lastCursorPos.current = {
          x: e.clientX,
          y: e.clientY,
        };

        return;
      }

      if (draggingShape === null) {
        startPan();

        setIsDragging(true);

        lastCursorPos.current = {
          x: e.clientX,
          y: e.clientY,
        };
      }
    },
    [draggingShape, getCanvasCoordinates, startDrawing, startPan],
  );

  // --------------------------------------------------
  // Canvas pointer move
  // --------------------------------------------------

  const handleMouseMove = useCallback(
    (e: React.PointerEvent) => {
      // --------------------------------------------
      // Shape drag
      // --------------------------------------------

      if (draggingShape !== null) {
        const scrollMargin = 50;

        const scrollSpeed = 5;

        let canvasDeltaX = 0;

        let canvasDeltaY = 0;

        if (e.clientX < scrollMargin) {
          canvasDeltaX = scrollSpeed;
        } else if (e.clientX > window.innerWidth - scrollMargin) {
          canvasDeltaX = -scrollSpeed;
        }

        if (e.clientY < scrollMargin) {
          canvasDeltaY = scrollSpeed;
        } else if (e.clientY > window.innerHeight - scrollMargin) {
          canvasDeltaY = -scrollSpeed;
        }

        /*
         * Edge auto-pan:
         * transient only.
         */
        if (canvasDeltaX !== 0 || canvasDeltaY !== 0) {
          isAutoPanning.current = true;

          updatePan(canvasDeltaX, canvasDeltaY);

          schedulePanVisual();
        }

        /*
         * Calculate position using the
         * latest transient viewport.
         */
        const pointerCanvasPosition = getCanvasCoordinates(
          e.clientX,
          e.clientY,
        );

        dragPosition.current = {
          x: pointerCanvasPosition.x - dragOffset.current.x,

          y: pointerCanvasPosition.y - dragOffset.current.y,
        };

        scheduleDragVisual();

        lastCursorPos.current = {
          x: e.clientX,
          y: e.clientY,
        };

        return;
      }

      // --------------------------------------------
      // Drawing
      // --------------------------------------------

      if (isDrawing()) {
        const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);

        updateDrawing(canvasCoords);

        return;
      }

      // --------------------------------------------
      // Normal pan
      // --------------------------------------------

      if (isDragging) {
        const deltaX = e.clientX - lastCursorPos.current.x;

        const deltaY = e.clientY - lastCursorPos.current.y;

        updatePan(deltaX, deltaY);

        schedulePanVisual();

        lastCursorPos.current = {
          x: e.clientX,
          y: e.clientY,
        };
      }
    },
    [
      draggingShape,
      getCanvasCoordinates,
      isDrawing,
      isDragging,
      scheduleDragVisual,
      schedulePanVisual,
      updateDrawing,
      updatePan,
    ],
  );

  // --------------------------------------------------
  // Pointer up
  // --------------------------------------------------

  const handleMouseUp = useCallback(() => {
    // --------------------------------------------
    // Drawing
    // --------------------------------------------

    if (isDrawing()) {
      finishDrawing();

      setMode("pan");
    }

    // --------------------------------------------
    // Shape drag
    // --------------------------------------------

    if (draggingShape !== null) {
      if (dragFrame.current !== null) {
        cancelAnimationFrame(dragFrame.current);

        dragFrame.current = null;
      }

      applyDragVisual();

      const finalPosition = dragPosition.current;

      if (finalPosition) {
        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === draggingShape
              ? {
                  ...shape,
                  x: finalPosition.x,
                  y: finalPosition.y,
                }
              : shape,
          ),
        );
      }

      const element = shapeElements.current.get(draggingShape);

      if (element) {
        element.style.transform = "none";
      }

      dragPosition.current = null;
    }

    // --------------------------------------------
    // Normal pan OR edge auto-pan
    // --------------------------------------------

    if (isDragging || isAutoPanning.current) {
      if (panFrame.current !== null) {
        cancelAnimationFrame(panFrame.current);

        panFrame.current = null;
      }

      applyViewportVisual();

      // minimapRef.current?.updateTransientViewport(currentViewport);

      commitPan();

      isAutoPanning.current = false;
    }

    setIsDragging(false);

    setDraggingShape(null);
  }, [
    applyDragVisual,
    applyViewportVisual,
    commitPan,
    draggingShape,
    finishDrawing,
    isDrawing,
    isDragging,
  ]);

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      if (dragFrame.current !== null) {
        cancelAnimationFrame(dragFrame.current);
      }

      if (panFrame.current !== null) {
        cancelAnimationFrame(panFrame.current);
      }

      if (zoomFrame.current !== null) {
        cancelAnimationFrame(zoomFrame.current);
      }

      if (zoomCommitTimer.current !== null) {
        clearTimeout(zoomCommitTimer.current);
      }
    };
  }, []);

  // --------------------------------------------------
  // Global mouse up
  // --------------------------------------------------

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleMouseUp]);

  // --------------------------------------------------
  // Toolbar
  // --------------------------------------------------

  const handleShapeSelect = useCallback(() => {
    setMode("draw");
  }, []);

  // --------------------------------------------------
  // Minimap
  // --------------------------------------------------

  const handleMinimapPositionChange = useCallback(
    (newPosition: { x: number; y: number }) => {
      setPosition(newPosition);
    },
    [setPosition],
  );

  const handleMinimapTransientPositionChange = useCallback(
    (newPosition: { x: number; y: number }) => {
      updatePositionTransient(newPosition);

      const element = canvasContentRef.current;

      if (!element) {
        return;
      }

      element.style.transform =
        `translate(${newPosition.x}px, ${newPosition.y}px) ` +
        `scale(${viewportRef.current.scale})`;
    },
    [updatePositionTransient, viewportRef],
  );

  const handleMinimapPositionCommit = useCallback(() => {
    commitPosition();
  }, [commitPosition]);

  // --------------------------------------------------
  // Canvas bounds
  // --------------------------------------------------

  const canvasBounds = useMemo(() => {
    let bounds = {
      minX: -window.innerWidth,

      maxX: window.innerWidth * 2,

      minY: -window.innerHeight,

      maxY: window.innerHeight * 2,
    };

    shapes.forEach((shape) => {
      bounds.minX = Math.min(bounds.minX, shape.x);

      bounds.maxX = Math.max(bounds.maxX, shape.x + shape.width);

      bounds.minY = Math.min(bounds.minY, shape.y);

      bounds.maxY = Math.max(bounds.maxY, shape.y + shape.height);
    });

    return {
      width: bounds.maxX - bounds.minX,

      height: bounds.maxY - bounds.minY,
    };
  }, [shapes]);

  // --------------------------------------------------
  // Pointer events
  // --------------------------------------------------

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      handleMouseDown(event);
    },
    [handleMouseDown],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      handleMouseMove(event);
    },
    [handleMouseMove],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      handleMouseUp();
    },
    [handleMouseUp],
  );

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      handleMouseUp();
    },
    [handleMouseUp],
  );

  // --------------------------------------------------
  // Native wheel
  // --------------------------------------------------

  const handleNativeWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      startZoom();

      zoomAtTransient(
        {
          x: event.clientX,
          y: event.clientY,
        },
        event.deltaY,
      );

      scheduleZoomVisual();

      if (zoomCommitTimer.current !== null) {
        clearTimeout(zoomCommitTimer.current);
      }

      zoomCommitTimer.current = setTimeout(() => {
        zoomCommitTimer.current = null;

        if (zoomFrame.current !== null) {
          cancelAnimationFrame(zoomFrame.current);

          zoomFrame.current = null;
        }

        const currentViewport = viewportRef.current;

        applyViewportVisual();

        minimapRef.current?.updateTransientViewport(currentViewport);

        commitZoom();
      }, 100);
    },
    [
      applyViewportVisual,
      commitZoom,
      scheduleZoomVisual,
      startZoom,
      viewportRef,
      zoomAtTransient,
    ],
  );

  // --------------------------------------------------
  // Native wheel listener
  // --------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.addEventListener("wheel", handleNativeWheel, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("wheel", handleNativeWheel);
    };
  }, [handleNativeWheel]);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <>
      <Toolbar
        onShapeSelect={handleShapeSelect}
        onReset={() => {
          setShapes([]);
        }}
      />

      <div
        ref={canvasRef}
        className={`infinite-canvas ${mode === "draw" ? "draw-mode" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          ref={canvasContentRef}
          className="canvas-content"
          style={{
            transform:
              `translate(${viewport.x}px, ${viewport.y}px) ` +
              `scale(${viewport.scale})`,

            width: canvasBounds.width,

            height: canvasBounds.height,
          }}
        >
          {shapes.map((shape) => (
            <ShapeView
              key={shape.id}
              shape={shape}
              isDragging={draggingShape === shape.id}
              isDrawingPreview={drawingShapeId === shape.id}
              onPointerDown={handleShapePointerDown}
              registerElement={registerShapeElement}
            />
          ))}
        </div>
      </div>

      <Minimap
        ref={minimapRef}
        shapes={shapes}
        canvasPosition={{
          x: viewport.x,
          y: viewport.y,
        }}
        scale={viewport.scale}
        onPositionChange={handleMinimapPositionChange}
        onTransientPositionChange={handleMinimapTransientPositionChange}
        onPositionCommit={handleMinimapPositionCommit}
        viewportSize={{
          width: window.innerWidth,

          height: window.innerHeight,
        }}
      />
    </>
  );
}

export default App;
