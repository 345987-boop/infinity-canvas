import { memo } from "react";
import type { Shape } from "../types";

type ShapeViewProps = {
  shape: Shape;
  isDragging: boolean;
  isDrawingPreview: boolean;
  onPointerDown: (
    e: React.PointerEvent<HTMLDivElement>,
    shapeId: string,
  ) => void;
  registerElement: (
    shapeId: string,
    element: HTMLDivElement | null,
  ) => void;
};

const ShapeView = memo(function ShapeView({
  shape,
  isDragging,
  isDrawingPreview,
  onPointerDown,
  registerElement,
}: ShapeViewProps) {

  return (
    <div
      ref={(element) =>
        registerElement(shape.id, element)
      }
      className={`shape shape-${shape.type} ${
        isDragging ? "dragging" : ""
      } ${
        isDrawingPreview
          ? "drawing-preview"
          : ""
      }`}
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        borderRadius: "8px",
        backgroundColor: shape.color,
        borderColor: shape.color,
        zIndex: shape.zIndex,
      }}
      onPointerDown={(e) =>
        onPointerDown(e, shape.id)
      }
    />
  );
});

export default ShapeView;