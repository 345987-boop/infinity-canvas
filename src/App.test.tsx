import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the canvas workspace and minimap", () => {
    render(<App />);

    expect(document.querySelector(".infinite-canvas")).toBeInTheDocument();
    expect(document.querySelector(".minimap")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });
});
