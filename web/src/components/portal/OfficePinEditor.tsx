"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  officeId: number;
  latitude: number | null;
  longitude: number | null;
  send: (url: string, payload: unknown, method?: string) => void;
};

const TURKEY: [number, number] = [39, 35];

function parse(value: string, limit: number): number | null {
  const n = Number(value.replace(",", "."));
  return value.trim() !== "" && Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

/** Leaflet/OSM map (same stack as the public office map) to correct one office pin. */
export function OfficePinEditor({ officeId, latitude, longitude, send }: Props) {
  const node = useRef<HTMLDivElement>(null);
  const marker = useRef<import("leaflet").Marker | null>(null);
  const [lat, setLat] = useState(latitude?.toString() ?? "");
  const [lng, setLng] = useState(longitude?.toString() ?? "");

  useEffect(() => {
    setLat(latitude?.toString() ?? "");
    setLng(longitude?.toString() ?? "");
  }, [latitude, longitude]);

  useEffect(() => {
    const host = node.current;
    if (!host) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    void (async () => {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !node.current) return;
      const L = leaflet.default;
      map = L.map(node.current, { attributionControl: false, scrollWheelZoom: false });
      L.control.attribution({ prefix: false }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      const has = latitude !== null && longitude !== null;
      const start: [number, number] = has ? [latitude, longitude] : TURKEY;
      map.setView(start, has ? 16 : 5);
      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#ec3323;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const place = (point: import("leaflet").LatLng) => {
        const p: [number, number] = [Number(point.lat.toFixed(7)), Number(point.lng.toFixed(7))];
        if (!marker.current && map) {
          marker.current = L.marker(p, { draggable: true, icon }).addTo(map);
          marker.current.on("dragend", () => marker.current && place(marker.current.getLatLng()));
        } else {
          marker.current?.setLatLng(p);
        }
        setLat(String(p[0]));
        setLng(String(p[1]));
      };
      if (has) place(L.latLng(start[0], start[1]));
      map.on("click", (event) => place(event.latlng));
      window.setTimeout(() => map?.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      marker.current = null;
      map?.remove();
    };
  }, [latitude, longitude]);

  const la = parse(lat, 90);
  const lo = parse(lng, 180);
  const valid = la !== null && lo !== null && !(la === 0 && lo === 0);

  return (
    <div className="glass-section">
      <h4>Harita konumu</h4>
      <p className="glass-muted">Pin yanlışsa haritaya tıklayın ya da pini sürükleyin, sonra kaydedin.</p>
      <div ref={node} className="sk-office-map sk-office-pin-map" role="region" aria-label="Ofis konumu" />
      <div className="glass-fields">
        <label>
          Enlem
          <input inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="41.0082" />
        </label>
        <label>
          Boylam
          <input inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="28.9784" />
        </label>
      </div>
      <div className="glass-actions">
        <button
          type="button"
          className="glass-btn"
          disabled={!valid}
          onClick={() => send(`/api/v1/portal/offices/${officeId}/location`, { latitude: la, longitude: lo }, "PUT")}
        >
          Konumu kaydet
        </button>
        {latitude !== null ? (
          <button
            type="button"
            className="glass-btn-lite"
            onClick={() => send(`/api/v1/portal/offices/${officeId}/location`, { latitude: null, longitude: null }, "PUT")}
          >
            Konumu kaldır
          </button>
        ) : null}
      </div>
    </div>
  );
}
