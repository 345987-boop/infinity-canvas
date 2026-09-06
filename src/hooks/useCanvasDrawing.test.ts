import { act, renderHook } from "@testing-library/react";
import type { Shape } from "../types";
import { useCanvasDrawing } from "./useCanvasDrawing";

const shape: Shape = {
  id: "shape-1",
  type: "rectangle",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  color: "#ffffff",
  zIndex: 1,
};

describe("useCanvasDrawing", () => {
  beforeEach(() => {
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates the preview through the DOM and transient callback", () => {
    const element = document.createElement("div");
    const setShapes = jest.fn();
    const onTransientDrawingChange = jest.fn();
    const { result } = renderHook(() =>
      useCanvasDrawing({
        shapes: [shape],
        setShapes,
        getShapeElement: () => element,
        onTransientDrawingChange,
      }),
    );

    act(() => {
      result.current.startDrawing("shape-1", { x: 100, y: 100 });
      result.current.updateDrawing({ x: 40, y: 70 });
    });

    expect(element.style.left).toBe("40px");
    expect(element.style.top).toBe("70px");
    expect(element.style.width).toBe("60px");
    expect(element.style.height).toBe("30px");
    expect(onTransientDrawingChange).toHaveBeenCalledWith("shape-1", {
      x: 40,
      y: 70,
      width: 60,
      height: 30,
    });
    expect(setShapes).not.toHaveBeenCalled();
  });

  it("commits the final geometry and clears the drawing state", () => {
    const setShapes = jest.fn();
    const { result } = renderHook(() =>
      useCanvasDrawing({
        shapes: [shape],
        setShapes,
        getShapeElement: () => null,
      }),
    );

    act(() => {
      result.current.startDrawing("shape-1", { x: 10, y: 20 });
      result.current.updateDrawing({ x: 50, y: 80 });
    });

    act(() => {
      result.current.finishDrawing();
    });

    expect(setShapes).toHaveBeenCalledTimes(1);
    const update = setShapes.mock.calls[0][0] as (previous: Shape[]) => Shape[];
    expect(update([shape])[0]).toMatchObject({
      x: 10,
      y: 20,
      width: 40,
      height: 60,
    });
    expect(result.current.isDrawing()).toBe(false);
    expect(result.current.drawingShapeId).toBe(null);
  });

  it("removes shapes that are too small to keep", () => {
    const setShapes = jest.fn();
    const { result } = renderHook(() =>
      useCanvasDrawing({
        shapes: [shape],
        setShapes,
        getShapeElement: () => null,
      }),
    );

    act(() => {
      result.current.startDrawing("shape-1", { x: 10, y: 20 });
      result.current.updateDrawing({ x: 12, y: 24 });
      result.current.finishDrawing();
    });

    const update = setShapes.mock.calls[0][0] as (previous: Shape[]) => Shape[];
    expect(update([shape])).toEqual([]);
  });
});
