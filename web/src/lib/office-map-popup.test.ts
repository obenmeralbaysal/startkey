import assert from "node:assert/strict";
import test from "node:test";

import { pinClickMovesMap, popupHost, stickyPopupOptions } from "./office-map-popup.ts";


test("a single office pin does not zoom", () => {
  assert.equal(pinClickMovesMap("pin"), false);
  assert.equal(pinClickMovesMap("cluster"), true);
});

test("the popup stays open through pan, zoom, and re-clustering", () => {
  assert.deepEqual(stickyPopupOptions(), { autoPan: false, autoClose: false, closeOnClick: false });
  assert.equal(popupHost(true), "marker");
  assert.equal(popupHost(false), "latlng");
});
