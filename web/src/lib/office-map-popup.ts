/** Single-pin clicks open a popup and leave the zoom unchanged. Cluster clicks still zoom. */
export function pinClickMovesMap(target: "pin" | "cluster"): boolean {
  return target === "cluster";
}

/** Opening a popup must not pan the map, and zoom or re-clustering must not close it. */
export function stickyPopupOptions(): { autoPan: false; autoClose: false; closeOnClick: false } {
  return { autoPan: false, autoClose: false, closeOnClick: false };
}

/** When clustering removes the marker, the popup stays on the map at the pin coordinate. */
export function popupHost(markerOnMap: boolean): "marker" | "latlng" {
  return markerOnMap ? "marker" : "latlng";
}
