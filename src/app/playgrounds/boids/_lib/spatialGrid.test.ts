import { SpatialGrid } from "./spatialGrid";

describe("SpatialGrid", () => {
  it("returns an inserted index when queried from the same position", () => {
    const grid = new SpatialGrid(500, 500, 75);
    grid.insert(0, 100, 100);
    expect(grid.query(100, 100)).toContain(0);
  });

  it("returns an index from an adjacent cell", () => {
    const grid = new SpatialGrid(500, 500, 75);
    grid.insert(0, 74, 100); // sits in cell (0, 1)
    expect(grid.query(76, 100)).toContain(0); // query from cell (1, 1)
  });

  it("does not return an index from a non-adjacent cell", () => {
    const grid = new SpatialGrid(500, 500, 75);
    grid.insert(0, 0, 0);
    expect(grid.query(300, 300)).not.toContain(0);
  });

  it("clear removes all entries", () => {
    const grid = new SpatialGrid(500, 500, 75);
    grid.insert(0, 100, 100);
    grid.clear();
    expect(grid.query(100, 100)).not.toContain(0);
  });

  it("returns multiple indices from the same cell", () => {
    const grid = new SpatialGrid(500, 500, 75);
    grid.insert(0, 100, 100);
    grid.insert(1, 110, 110);
    const result = grid.query(100, 100);
    expect(result).toContain(0);
    expect(result).toContain(1);
  });
});
