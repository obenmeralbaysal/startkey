import assert from "node:assert/strict";
import test from "node:test";

import { directoryHref, sortTurkish } from "./directory-query.ts";

test("district names sort with Turkish collation", () => {
  assert.deepEqual(sortTurkish(["Şişli", "Çankaya", "Kadıköy", "Beşiktaş"]), [
    "Beşiktaş",
    "Çankaya",
    "Kadıköy",
    "Şişli",
  ]);
});

test("live search keeps q in the directory URL", () => {
  assert.equal(
    directoryHref("/tr/danismanlar", { q: "Cevdet Kömürcüoğlu", il: "İstanbul", ilce: "Şişli", ofis: "" }),
    "/tr/danismanlar?q=Cevdet+K%C3%B6m%C3%BCrc%C3%BCo%C4%9Flu&il=%C4%B0stanbul&ilce=%C5%9Ei%C5%9Fli",
  );
  assert.equal(directoryHref("/tr/ofisler", { q: "", il: "", ilce: "", ofis: "" }), "/tr/ofisler");
});
