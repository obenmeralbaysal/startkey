import type { Map as LeafletMap, MapOptions } from "leaflet";

/** Web Mercator world. Past this latitude there are no map tiles. */
export const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-85.05112878, -180],
  [85.05112878, 180],
];

export const WORLD_MAX_BOUNDS_VISCOSITY = 1;

type WorldFillMap = Pick<LeafletMap, "getSize" | "getBoundsZoom" | "setMinZoom" | "on" | "off" | "getContainer"> & {
  options: MapOptions;
};

/** Map options that keep a drag from sliding into the empty grey outside the world. */
export function worldMapOptions(): Pick<MapOptions, "maxBounds" | "maxBoundsViscosity"> {
  return {
    maxBounds: WORLD_BOUNDS,
    maxBoundsViscosity: WORLD_MAX_BOUNDS_VISCOSITY,
  };
}

/**
 * Lowest zoom at which the world still covers the container.
 * `getBoundsZoom(..., true)` ceils to the snap so a wide map (2560, 3840, …)
 * cannot stop on a level where the tiles are narrower than the frame.
 * The previous minZoom is cleared first: Leaflet clamps the result to the
 * current minimum, which would freeze a wide-screen floor after a shrink.
 */
export function syncWorldMinZoom(map: WorldFillMap): number | null {
  const size = map.getSize();
  if (size.x < 1 || size.y < 1) return null;
  const previous = map.options.minZoom;
  map.options.minZoom = 0;
  let zoom: number;
  try {
    zoom = map.getBoundsZoom(WORLD_BOUNDS, true);
  } catch (error) {
    map.options.minZoom = previous;
    throw error;
  }
  if (!Number.isFinite(zoom)) {
    map.options.minZoom = previous;
    return null;
  }
  map.setMinZoom(zoom);
  return zoom;
}

/** Apply the world floor now, and again whenever the container size changes. */
export function bindWorldFill(map: WorldFillMap): () => void {
  const apply = () => {
    syncWorldMinZoom(map);
  };
  apply();
  map.on("resize", apply);
  let observer: ResizeObserver | undefined;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => apply());
    observer.observe(map.getContainer());
  }
  return () => {
    map.off("resize", apply);
    observer?.disconnect();
  };
}
