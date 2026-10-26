import { createElement, type ReactNode } from "react";

export const WATERMARK_IMAGE_LABEL = "Filigranlı görsel";

export const WATERMARK_BANNER =
  "Bu portföydeki bazı görseller Sahibinden filigranı taşıyor. Aktif yapmak için filigransız görselleri yükleyin.";

export function watermarkBadgeLabel(flagged: boolean): string | null {
  return flagged ? WATERMARK_IMAGE_LABEL : null;
}

export function WatermarkBadge({ flagged, compact = false }: { flagged: boolean; compact?: boolean }): ReactNode {
  const label = watermarkBadgeLabel(flagged);
  if (!label) {
    return null;
  }
  return createElement(
    "span",
    { className: "glass-pill", "data-tone": "hidden", "data-watermark": compact ? "list" : "image" },
    label,
  );
}

export function WatermarkBanner({ show }: { show: boolean }): ReactNode {
  if (!show) {
    return null;
  }
  return createElement("p", { className: "glass-notice glass-banner-watermark", "data-tone": "error", role: "status" }, WATERMARK_BANNER);
}

export function hasWatermarkedMedia(row: Record<string, unknown> | null | undefined): boolean {
  return flag(row?.has_watermarked_media);
}

export function isWatermarkedImage(row: Record<string, unknown>): boolean {
  return flag(row.is_watermarked);
}

export function portfolioMedia(row: Record<string, unknown> | null | undefined): Record<string, unknown>[] {
  if (!row) {
    return [];
  }
  for (const key of ["media", "images", "photos"] as const) {
    const value = row[key];
    if (!Array.isArray(value)) {
      continue;
    }
    const items = value.filter(isRecord);
    if (items.length > 0) {
      return items;
    }
  }
  return [];
}

export function mediaThumb(item: Record<string, unknown>): string {
  for (const key of ["thumb", "thumbnail", "url", "path", "photo", "image", "original"]) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

/** 422 key `watermarked_media` from an activation attempt. */
export function watermarkActivationMessage(payload: Record<string, unknown>): string | null {
  if (!isWatermarkRejection(payload)) {
    return null;
  }
  const errors = payload.errors;
  if (isRecord(errors)) {
    const value = errors.watermarked_media;
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim() && value[0] !== "watermarked_media") {
      return value[0];
    }
  }
  if (typeof payload.message === "string" && payload.message.trim() && payload.message !== "watermarked_media") {
    return payload.message;
  }
  return WATERMARK_BANNER;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWatermarkRejection(payload: Record<string, unknown>): boolean {
  if (payload.error === "watermarked_media" || payload.key === "watermarked_media") {
    return true;
  }
  return isRecord(payload.errors) && "watermarked_media" in payload.errors;
}

function flag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}
