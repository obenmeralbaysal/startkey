"use client";

import { useEffect, useRef } from "react";

import type { MapOffice } from "@/lib/api";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/** Leaflet map of catalogue offices. Loaded only in the browser. */
export function OfficeMap({ offices, zoom = 8, label = "Startkey Global" }: { offices: MapOffice[]; zoom?: number; label?: string }) {
  const node = useRef<HTMLDivElement>(null);

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
        maxZoom: 18,
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const office of offices) {
        if (!Number.isFinite(office.latitude) || !Number.isFinite(office.longitude)) continue;
        const href = office.urlPath.startsWith("/") ? office.urlPath : "/";
        L.circleMarker([office.latitude, office.longitude], {
          radius: 7,
          color: "#ec3323",
          weight: 2,
          fillColor: "#ec3323",
          fillOpacity: 0.9,
        })
          .bindPopup(`<a href="${escapeHtml(href)}">${escapeHtml(office.name)}</a>`)
          .addTo(map);
        bounds.push([office.latitude, office.longitude]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [28, 28] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], zoom);
      } else {
        map.setView([39, 35], 5);
      }
      window.setTimeout(() => map?.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [offices, zoom]);

  return <div ref={node} className="sk-office-map" role="region" aria-label={label} />;
}
