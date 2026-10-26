/** Main photo plus at most this many thumbnails. The last slot becomes +N at 5 photos. */

export type ListingLocale = "tr" | "en" | "de";
export const GALLERY_THUMB_SLOTS = 4;

const MARK = /\/catalogue-mark\.svg(?:$|\?)/i;

export interface ThumbSlot {
  kind: "photo" | "more";
  index: number;
  remaining: number;
}

export interface GallerySlots {
  mainIndex: number | null;
  thumbs: ThumbSlot[];
}

export function isPlaceholderPhoto(src: string | null | undefined): boolean {
  if (src == null) {
    return true;
  }
  const value = src.trim();
  return value === "" || MARK.test(value);
}

export function listingPhotoSources(values: Array<string | null | undefined>): string[] {
  const photos: string[] = [];
  for (const value of values) {
    if (typeof value !== "string" || isPlaceholderPhoto(value) || photos.includes(value)) {
      continue;
    }
    photos.push(value);
  }
  return photos;
}

/**
 * One main photo and up to four thumbnails.
 * Fewer than five photos leave no empty frames.
 * Five or more: the fourth thumbnail is +N, where N is every photo after the main photo and the first three thumbnails.
 */
export function gallerySlots(count: number): GallerySlots {
  if (count <= 0) {
    return { mainIndex: null, thumbs: [] };
  }
  if (count === 1) {
    return { mainIndex: 0, thumbs: [] };
  }
  if (count < 5) {
    const thumbs: ThumbSlot[] = [];
    for (let index = 1; index < count; index += 1) {
      thumbs.push({ kind: "photo", index, remaining: 0 });
    }
    return { mainIndex: 0, thumbs };
  }
  return {
    mainIndex: 0,
    thumbs: [
      { kind: "photo", index: 1, remaining: 0 },
      { kind: "photo", index: 2, remaining: 0 },
      { kind: "photo", index: 3, remaining: 0 },
      { kind: "more", index: 4, remaining: count - 4 },
    ],
  };
}

export function wrapIndex(index: number, count: number, delta: number): number {
  if (count <= 0) {
    return 0;
  }
  const next = (Math.trunc(index) + Math.trunc(delta)) % count;
  return next < 0 ? next + count : next;
}

export function photoPlaceholder(locale: ListingLocale): string {
  if (locale === "en") {
    return "Photos coming soon";
  }
  if (locale === "de") {
    return "Fotos folgen in Kürze";
  }
  return "Fotoğraf hazırlanıyor";
}

export function morePhotosText(locale: ListingLocale, remaining: number): string {
  const count = Math.max(0, Math.trunc(remaining));
  if (locale === "en") {
    return `+${count} photos`;
  }
  if (locale === "de") {
    return `+${count} Fotos`;
  }
  return `+${count} fotoğraf`;
}

export function lightboxCounter(index: number, count: number): string {
  if (count <= 0) {
    return "0 / 0";
  }
  const current = wrapIndex(index, count, 0) + 1;
  return `${current} / ${count}`;
}

export function localeFromListingPath(path: string): ListingLocale {
  const head = path.split("/").filter(Boolean)[0] ?? "";
  if (head === "en" || head === "de") {
    return head;
  }
  return "tr";
}

export function listingContactCopy(locale: ListingLocale): { call: string; office: string } {
  if (locale === "en") {
    return { call: "Call", office: "Office" };
  }
  if (locale === "de") {
    return { call: "Anrufen", office: "Büro" };
  }
  return { call: "Ara", office: "Ofis" };
}

export function showListingConsultant(agent: { name?: string; approved?: boolean }): boolean {
  if (agent.approved === false) {
    return false;
  }
  return (agent.name ?? "").trim() !== "";
}
