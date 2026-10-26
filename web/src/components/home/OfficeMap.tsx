"use client";

import { useEffect, useRef } from "react";

import type { MapOffice } from "@/lib/api";
import { officeMapTiles } from "@/lib/config";
import { bindWorldFill, syncWorldMinZoom, worldMapOptions } from "@/lib/leaflet-world";
import { mapPinPosition } from "@/lib/map-coordinates";
import { pinClickMovesMap, popupHost, stickyPopupOptions } from "@/lib/office-map-popup";

/** Pixel inset so every pin, including the corner ones, stays inside the frame. */
const BOUNDS_PADDING = 40;
/**
 * Zoom and the reset control occupy the top-left. The northwest pin (the
 * England office) would sit under them with an even 40px inset.
 */
const BOUNDS_PADDING_TOP_LEFT: [number, number] = [48, 118];

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

type Leaflet = typeof import("leaflet");

function withLeafletGlobal(L: Leaflet): void {
  (globalThis as unknown as { L: Leaflet }).L = L;
}

/** Leaflet map of catalogue offices. Loaded only in the browser. */
export function OfficeMap({
  offices,
  zoom = 8,
  label = "Startkey Global",
  resetLabel = "Tümünü göster",
  className = "",
  overview = false,
  onSelect,
  onCenter,
}: {
  offices: MapOffice[];
  zoom?: number;
  label?: string;
  resetLabel?: string;
  className?: string;
  /** Homepage: cluster pins, fit every office, and offer a labeled reset. A pin opens its popup without zooming. */
  overview?: boolean;
  /** Homepage desktop card: a pin was clicked. */
  onSelect?: (officeId: number) => void;
  /** Homepage desktop card: the map centre after a move. */
  onCenter?: (center: { latitude: number; longitude: number }) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onSelect, onCenter });
  callbacks.current = { onSelect, onCenter };

  useEffect(() => {
    const host = node.current;
    if (!host) return;
    let map: import("leaflet").Map | undefined;
    let unbindWorld: (() => void) | undefined;
    let cancelled = false;
    let settle: number | undefined;

    void (async () => {
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      const L = leaflet.default;
      if (overview) {
        withLeafletGlobal(L);
        await import("leaflet.markercluster");
        await import("leaflet.markercluster/dist/MarkerCluster.css");
        await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
      }
      if (cancelled || !node.current) return;
      map = L.map(node.current, {
        attributionControl: false,
        scrollWheelZoom: false,
        ...worldMapOptions(),
      });
      L.control.attribution({ prefix: false }).addTo(map);
      const tiles = officeMapTiles();
      L.tileLayer(tiles.url, {
        attribution: tiles.attribution,
        maxZoom: 18,
        noWrap: true,
      }).addTo(map);
      unbindWorld = bindWorldFill(map);

      const group = overview
        ? L.markerClusterGroup({
            showCoverageOnHover: false,
            iconCreateFunction(cluster) {
              const count = cluster.getChildCount();
              return L.divIcon({
                html: `<span>${count}</span>`,
                className: "sk-office-cluster",
                iconSize: L.point(36, 36),
              });
            },
          }).addTo(map)
        : null;

      const bounds = L.latLngBounds([]);
      let placed = 0;
      let sticky: import("leaflet").Popup | undefined;
      const hold = (latlng: import("leaflet").LatLng, html: string, markerOnMap: boolean) => {
        if (!map) return;
        const host = popupHost(markerOnMap);
        if (!sticky) sticky = L.popup({ ...stickyPopupOptions(), closeButton: true });
        sticky.setLatLng(host === "latlng" || !markerOnMap ? latlng : latlng).setContent(html);
        if (!sticky.isOpen()) sticky.openOn(map);
        else sticky.update();
      };
      const reopen = () => {
        if (!map || !sticky) return;
        const markerOnMap = sticky.getLatLng() !== undefined;
        if (!sticky.isOpen() && markerOnMap) sticky.openOn(map);
      };
      for (const office of offices) {
        const position = mapPinPosition(office.latitude, office.longitude);
        if (!position) continue;
        placed += 1;
        const latlng = L.latLng(position.latitude, position.longitude);
        const href = office.urlPath.startsWith("/") ? office.urlPath : "/";
        const html = `<a href="${escapeHtml(href)}">${escapeHtml(office.name)}</a>`;
        const marker = L.circleMarker(latlng, {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: "#ec3323",
          fillOpacity: 1,
          className: "sk-office-pin",
        });
        if (overview) {
          marker.on("click", (event) => {
            L.DomEvent.stopPropagation(event);
            if (pinClickMovesMap("pin") && map) {
              map.flyTo(latlng, 13);
            }
            const onMap = group ? group.hasLayer(marker) : map?.hasLayer(marker) === true;
            hold(latlng, html, onMap);
            callbacks.current.onSelect?.(office.id);
          });
        } else {
          marker.bindPopup(html);
        }
        if (group) group.addLayer(marker);
        else marker.addTo(map);
        bounds.extend(latlng);
      }
      if (overview && map) {
        map.on("zoomend", reopen);
        map.on("moveend", reopen);
        map.on("moveend", () => {
          if (!map) return;
          const c = map.getCenter();
          callbacks.current.onCenter?.({ latitude: c.lat, longitude: c.lng });
        });
        group?.on("animationend", reopen);
      }

      const fit = () => {
        if (!map) return;
        syncWorldMinZoom(map);
        if (placed > 1) {
          map.fitBounds(
            bounds,
            overview
              ? { paddingTopLeft: BOUNDS_PADDING_TOP_LEFT, paddingBottomRight: [BOUNDS_PADDING, BOUNDS_PADDING] }
              : { padding: [BOUNDS_PADDING, BOUNDS_PADDING] },
          );
        } else if (placed === 1) {
          map.setView(bounds.getCenter(), zoom);
        } else {
          map.setView([39, 35], 5);
        }
      };
      if (overview) {
        const ResetControl = L.Control.extend({
          options: { position: "topleft" },
          onAdd() {
            const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            const button = L.DomUtil.create("a", "sk-office-map-reset", container) as HTMLAnchorElement;
            button.href = "#";
            button.title = resetLabel;
            button.setAttribute("role", "button");
            button.setAttribute("aria-label", resetLabel);
            button.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>';
            const caption = L.DomUtil.create("span", "sk-office-map-reset-label", button);
            caption.textContent = resetLabel;
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(button, "click", (event) => {
              L.DomEvent.preventDefault(event);
              L.DomEvent.stop(event);
              fit();
            });
            return container;
          },
        });
        map.addControl(new ResetControl());
      }
      fit();
      settle = window.setTimeout(() => {
        map?.invalidateSize();
        fit();
      }, 0);
    })();

    return () => {
      cancelled = true;
      if (settle !== undefined) window.clearTimeout(settle);
      unbindWorld?.();
      map?.remove();
      map = undefined;
    };
  }, [offices, overview, resetLabel, zoom]);

  const classes = className === "" ? "sk-office-map" : `sk-office-map ${className}`;

  return <div ref={node} className={classes} role="region" aria-label={label} />;
}
