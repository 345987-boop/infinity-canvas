import { getRandomColor } from "./colors";

describe("getRandomColor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns a hex color", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    expect(getRandomColor()).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("returns the first and last palette entries at random boundaries", () => {
    jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValueOnce(0.999999);

    expect(getRandomColor()).toBe("#FF6B6B");
    expect(getRandomColor()).toBe("#01A3A4");
  });
});
