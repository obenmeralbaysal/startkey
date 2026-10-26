"use client";

import { useEffect, useRef } from "react";

import type { MapOffice } from "@/lib/api";

/** Mainland box used when Reonix has not sent `locationNeedsReview`. Inclusive. */
const TURKEY_LATITUDE = { min: 35.8, max: 42.2 };
const TURKEY_LONGITUDE = { min: 25.6, max: 44.9 };

function isInsideTurkey(latitude: number, longitude: number): boolean {
  return (
    latitude >= TURKEY_LATITUDE.min &&
    latitude <= TURKEY_LATITUDE.max &&
    longitude >= TURKEY_LONGITUDE.min &&
    longitude <= TURKEY_LONGITUDE.max
  );
}

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
export function OfficeMap({
  offices,
  zoom = 8,
  label = "Startkey Global",
  className = "",
  constrainBoundsToTurkey = false,
}: {
  offices: MapOffice[];
  zoom?: number;
  label?: string;
  className?: string;
  /** Homepage fitBounds ignores pins outside Turkey. Detail maps stay centered on their pin. */
  constrainBoundsToTurkey?: boolean;
}) {
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
        const outsideTurkey = constrainBoundsToTurkey && !isInsideTurkey(office.latitude, office.longitude);
        if (office.locationNeedsReview !== true && !outsideTurkey) {
          bounds.push([office.latitude, office.longitude]);
        }
      }

      const fit = () => {
        if (!map) return;
        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [20, 20] });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], zoom);
        } else {
          map.setView([39, 35], 5);
        }
      };
      fit();
      window.setTimeout(() => {
        map?.invalidateSize();
        fit();
      }, 0);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [offices, zoom, constrainBoundsToTurkey]);

  const classes = className === "" ? "sk-office-map" : `sk-office-map ${className}`;

  return <div ref={node} className={classes} role="region" aria-label={label} />;
}
