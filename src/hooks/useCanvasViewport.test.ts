import { act, renderHook } from "@testing-library/react";
import { useCanvasViewport } from "./useCanvasViewport";

describe("useCanvasViewport", () => {
  it("commits normal pan and scale updates", () => {
    const { result } = renderHook(() =>
      useCanvasViewport({
        initialViewport: { x: 10, y: 20, scale: 1 },
        minScale: 0.5,
        maxScale: 2,
      }),
    );

    act(() => {
      result.current.panBy(15, -5);
      result.current.setScale(3);
    });

    expect(result.current.viewport).toEqual({ x: 25, y: 15, scale: 2 });
  });

  it("keeps transient pan out of React state until commit", () => {
    const { result } = renderHook(() =>
      useCanvasViewport({ initialViewport: { x: 10, y: 20, scale: 1 } }),
    );

    act(() => {
      result.current.startPan();
      result.current.updatePan(30, 40);
    });

    expect(result.current.viewport).toEqual({ x: 10, y: 20, scale: 1 });
    expect(result.current.viewportRef.current).toEqual({
      x: 40,
      y: 60,
      scale: 1,
    });

    act(() => {
      result.current.commitPan();
    });

    expect(result.current.viewport).toEqual({ x: 40, y: 60, scale: 1 });
  });

  it("uses the latest transient viewport for coordinate conversion", () => {
    const { result } = renderHook(() =>
      useCanvasViewport({ initialViewport: { x: 0, y: 0, scale: 2 } }),
    );

    act(() => {
      result.current.startZoom();
      result.current.zoomAtTransient({ x: 100, y: 100 }, -100);
    });

    const canvasPoint = result.current.toCanvas({ x: 100, y: 100 });
    const screenPoint = result.current.toScreen(canvasPoint);

    expect(screenPoint.x).toBeCloseTo(100);
    expect(screenPoint.y).toBeCloseTo(100);
    expect(result.current.viewport.scale).toBe(2);
    expect(result.current.viewportRef.current.scale).toBeGreaterThan(2);
  });
});
