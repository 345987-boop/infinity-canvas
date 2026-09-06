import {
  canvasToScreen,
  screenToCanvas,
  zoomAtScreenPoint,
} from "./viewport";

describe("viewport utilities", () => {
  const viewport = { x: 120, y: -80, scale: 2 };

  it("converts between screen and canvas coordinates", () => {
    const canvasPoint = screenToCanvas(320, 120, viewport);

    expect(canvasPoint).toEqual({ x: 100, y: 100 });
    expect(canvasToScreen(canvasPoint.x, canvasPoint.y, viewport)).toEqual({
      x: 320,
      y: 120,
    });
  });

  it("keeps the cursor point stable while zooming", () => {
    const screenPoint = { x: 320, y: 120 };
    const nextViewport = zoomAtScreenPoint(
      viewport,
      screenPoint.x,
      screenPoint.y,
      -100,
    );
    const canvasPoint = screenToCanvas(
      screenPoint.x,
      screenPoint.y,
      nextViewport,
    );

    expect(canvasPoint).toEqual(screenToCanvas(screenPoint.x, screenPoint.y, viewport));
    expect(nextViewport.scale).toBeGreaterThan(viewport.scale);
  });

  it("clamps zoom to the configured scale range", () => {
    const maxed = zoomAtScreenPoint(viewport, 0, 0, -100000, 0.5, 2.5);
    const mined = zoomAtScreenPoint(viewport, 0, 0, 100000, 0.5, 2.5);

    expect(maxed.scale).toBe(2.5);
    expect(mined.scale).toBe(0.5);
  });

  it("returns the same viewport when zoom is already clamped", () => {
    const atMinimum = { x: 10, y: 20, scale: 0.5 };

    expect(zoomAtScreenPoint(atMinimum, 0, 0, 100000, 0.5, 2.5)).toBe(
      atMinimum,
    );
  });
});
