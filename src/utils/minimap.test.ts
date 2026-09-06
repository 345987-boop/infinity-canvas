import { Shape } from "../types";
import { getMinimapContentBounds } from "./minimap";

const shape: Shape = {
  id: "shape-1",
  type: "rectangle",
  x: 100,
  y: 200,
  width: 300,
  height: 150,
  color: "#ffffff",
  zIndex: 1,
};

describe("getMinimapContentBounds", () => {
  it("pads an empty canvas around the current viewport", () => {
    const bounds = getMinimapContentBounds(
      [],
      { x: -800, y: -600 },
      1,
      { width: 800, height: 600 },
    );

    expect(bounds).toEqual({
      minX: 400,
      maxX: 2000,
      minY: 300,
      maxY: 1500,
      width: 1600,
      height: 1200,
    });
  });

  it("includes shapes with padding and keeps the viewport visible", () => {
    const bounds = getMinimapContentBounds(
      [shape],
      { x: -50, y: -50 },
      1,
      { width: 800, height: 600 },
    );

    expect(bounds.minX).toBe(-100);
    expect(bounds.maxX).toBe(850);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxY).toBe(650);
    expect(bounds.width).toBe(950);
    expect(bounds.height).toBe(650);
  });
});
