import assert from "node:assert/strict";
import test from "node:test";

import type { Map as LeafletMap } from "leaflet";

import { syncWorldMinZoom, WORLD_BOUNDS, worldMapOptions } from "./leaflet-world.ts";

type FakeMap = {
  options: { minZoom?: number };
  sets: number[];
  width: number;
  height: number;
  measuredMin: number | undefined;
  getSize(): { x: number; y: number };
  getBoundsZoom(bounds: unknown, inside?: boolean): number;
  setMinZoom(zoom: number): void;
};

function fakeMap(width: number, height: number, boundsZoom: number): FakeMap {
  const map: FakeMap = {
    options: { minZoom: 5 },
    sets: [],
    width,
    height,
    measuredMin: undefined,
    getSize() {
      return { x: this.width, y: this.height };
    },
    getBoundsZoom(bounds, inside) {
      assert.deepEqual(bounds, WORLD_BOUNDS);
      assert.equal(inside, true);
      this.measuredMin = this.options.minZoom;
      return boundsZoom;
    },
    setMinZoom(zoom) {
      this.sets.push(zoom);
      this.options.minZoom = zoom;
    },
  };
  return map;
}

test("world lock uses the world bounds and a hard edge", () => {
  assert.deepEqual(worldMapOptions(), {
    maxBounds: WORLD_BOUNDS,
    maxBoundsViscosity: 1,
  });
});

test("wide screens take the zoom that fills the frame, measured from a zero floor", () => {
  for (const width of [2560, 3840]) {
    const map = fakeMap(width, 620, 4);
    assert.equal(syncWorldMinZoom(map as unknown as LeafletMap), 4);
    assert.equal(map.measuredMin, 0);
    assert.deepEqual(map.sets, [4]);
    assert.equal(map.options.minZoom, 4);
  }
});

test("a later smaller container can lower the floor", () => {
  const map = fakeMap(1280, 620, 3);
  map.options.minZoom = 4;
  assert.equal(syncWorldMinZoom(map as unknown as LeafletMap), 3);
  assert.equal(map.measuredMin, 0);
  assert.equal(map.options.minZoom, 3);
});

test("an empty container does not change minZoom", () => {
  const map = fakeMap(0, 620, 4);
  map.options.minZoom = 2;
  assert.equal(syncWorldMinZoom(map as unknown as LeafletMap), null);
  assert.deepEqual(map.sets, []);
  assert.equal(map.options.minZoom, 2);
});
