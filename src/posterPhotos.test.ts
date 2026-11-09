import { describe, expect, it } from "vitest";
import { posterImageForName, posterAlbumNames } from "./posterPhotos";

describe("9 FLOOR COFFEE poster album", () => {
  it("has distinct poster images for named drinks", () => {
    expect(posterAlbumNames.length).toBeGreaterThanOrEqual(60);
    for (const name of ["Iced Sea Salt Latte", "Dalgona Honey Latte", "Vanilla Oreo Milk", "Strawberry Cream Milk", "Mixed Berry Cream Milk", "Chocolate Oreo Cream", "Taro Oreo Milk"]) {
      expect(posterImageForName(name), name).toMatch(/^data:image\/jpeg;base64,/);
    }
  });
  it("does not assign an unrelated photo to an unknown drink", () => {
    expect(posterImageForName("Nonexistent Unrelated Beverage")).toBeNull();
  });
});
