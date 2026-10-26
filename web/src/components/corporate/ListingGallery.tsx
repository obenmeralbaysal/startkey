"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

import type { ListingGallerySlide } from "@/lib/corporate";
import {
  gallerySlots,
  isPlaceholderPhoto,
  lightboxCounter,
  listingPhotoSources,
  morePhotosText,
  photoPlaceholder,
  wrapIndex,
  type ListingLocale,
} from "@/lib/listing-gallery";

interface Photo {
  full: string;
  image: string;
  webp: string;
  thumb: string;
  caption: string;
}

function photosFromSlides(slides: ListingGallerySlide[]): Photo[] {
  const photos: Photo[] = [];
  for (const slide of slides) {
    const image = !isPlaceholderPhoto(slide.image)
      ? slide.image
      : !isPlaceholderPhoto(slide.original)
        ? slide.original
        : !isPlaceholderPhoto(slide.thumb)
          ? slide.thumb
          : "";
    if (image === "" || photos.some((photo) => photo.image === image)) {
      continue;
    }
    photos.push({
      full: !isPlaceholderPhoto(slide.original) ? slide.original : image,
      image,
      webp: isPlaceholderPhoto(slide.imageWebp) ? "" : slide.imageWebp,
      thumb: !isPlaceholderPhoto(slide.thumb) ? slide.thumb : image,
      caption: slide.caption || "",
    });
  }
  return photos;
}

function lightboxUi(locale: ListingLocale) {
  if (locale === "en") {
    return { close: "Close", previous: "Previous photo", next: "Next photo", gallery: "Photos" };
  }
  if (locale === "de") {
    return { close: "Schliessen", previous: "Vorheriges Foto", next: "Nächstes Foto", gallery: "Fotos" };
  }
  return { close: "Kapat", previous: "Önceki fotoğraf", next: "Sonraki fotoğraf", gallery: "Fotoğraflar" };
}

export function PhotoPlaceholder({ locale, className = "" }: { locale: ListingLocale; className?: string }) {
  const label = photoPlaceholder(locale);
  return (
    <span className={`sk-photo-placeholder ${className}`.trim()} data-photo-placeholder role="img" aria-label={label}>
      {label}
    </span>
  );
}

function FramedImage({
  photo,
  alt,
  failed,
  onFail,
}: {
  photo: Photo;
  alt: string;
  failed: boolean;
  onFail: () => void;
}) {
  if (failed) {
    return null;
  }
  return (
    <picture>
      {photo.webp ? <source srcSet={photo.webp} type="image/webp" /> : null}
      <img src={photo.image} alt={alt} onError={onFail} />
    </picture>
  );
}

export function ListingGallery({
  slides,
  locale,
  title,
  variant = "detail",
}: {
  slides: ListingGallerySlide[];
  locale: ListingLocale;
  title: string;
  variant?: "detail" | "compact";
}) {
  const available = photosFromSlides(slides);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const photos = available.filter((_, index) => !failed[index]);
  const slots = gallerySlots(photos.length);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const countRef = useRef(photos.length);
  const dragX = useRef<number | null>(null);
  countRef.current = photos.length;
  const ui = lightboxUi(locale);
  const active = photos[wrapIndex(index, photos.length, 0)];

  useEffect(() => {
    if (!open) {
      return;
    }
    const root = dialogRef.current;
    if (!root) {
      return;
    }
    const dialog: HTMLDivElement = root;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.focus();
    function focusable() {
      return Array.from(dialog.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])")).filter(
        (node) => !node.hasAttribute("disabled") && node !== dialog,
      );
    }
    function onKey(event: KeyboardEvent) {
      const total = countRef.current;
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => wrapIndex(current, total, 1));
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => wrapIndex(current, total, -1));
        return;
      }
      if (event.key !== "Tab") {
        return;
      }
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [open]);

  function openAt(next: number, opener: HTMLElement) {
    openerRef.current = opener;
    setIndex(next);
    setOpen(true);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    dragX.current = event.clientX;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragX.current == null) {
      return;
    }
    const delta = event.clientX - dragX.current;
    dragX.current = null;
    if (delta > 48) {
      setIndex((current) => wrapIndex(current, countRef.current, -1));
    } else if (delta < -48) {
      setIndex((current) => wrapIndex(current, countRef.current, 1));
    }
  }

  if (slots.mainIndex == null) {
    return <PhotoPlaceholder locale={locale} />;
  }

  const main = photos[slots.mainIndex];

  return (
    <>
      <div className="sk-photo-grid" data-gallery={variant} data-variant={variant} data-thumbs={slots.thumbs.length}>
        <button
          type="button"
          className="sk-photo-main"
          data-lightbox-trigger="main"
          aria-label={main.caption || title}
          onClick={(event) => openAt(slots.mainIndex ?? 0, event.currentTarget)}
        >
          <FramedImage
            photo={main}
            alt={main.caption || title}
            failed={false}
            onFail={() => setFailed((current) => ({ ...current, [available.indexOf(main)]: true }))}
          />
        </button>
        {slots.thumbs.length > 0 ? (
          <div className="sk-photo-thumbs" style={{ ["--thumb-n" as string]: String(slots.thumbs.length) }}>
            {slots.thumbs.map((slot) => {
              const photo = photos[slot.index];
              if (!photo) {
                return null;
              }
              const label = slot.kind === "more" ? morePhotosText(locale, slot.remaining) : photo.caption || title;
              return (
                <button
                  key={`${photo.image}-${slot.index}`}
                  type="button"
                  className="sk-photo-thumb"
                  data-lightbox-trigger={slot.kind === "more" ? "more" : "thumb"}
                  aria-label={label}
                  onClick={(event) => openAt(slot.index, event.currentTarget)}
                >
                  <img src={photo.thumb || photo.image} alt="" onError={() => setFailed((current) => ({ ...current, [available.indexOf(photo)]: true }))} />
                  {slot.kind === "more" ? <span className="sk-photo-more">{label}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {open && active && typeof document !== "undefined" ? createPortal(
        <div
          ref={dialogRef}
          className="sk-lightbox"
          data-lightbox=""
          role="dialog"
          aria-modal="true"
          aria-label={ui.gallery}
          tabIndex={-1}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <button type="button" className="sk-lightbox-close" onClick={() => setOpen(false)}>
            {ui.close}
          </button>
          <p className="sk-lightbox-count" data-lightbox-counter>
            {lightboxCounter(index, photos.length)}
          </p>
          <button type="button" className="sk-lightbox-nav sk-lightbox-prev" aria-label={ui.previous} onClick={() => setIndex((current) => wrapIndex(current, photos.length, -1))}>
            ‹
          </button>
          <div className="sk-lightbox-frame">
            <img src={active.full || active.image} alt={active.caption || title} />
          </div>
          <button type="button" className="sk-lightbox-nav sk-lightbox-next" aria-label={ui.next} onClick={() => setIndex((current) => wrapIndex(current, photos.length, 1))}>
            ›
          </button>
        </div>
      , document.body) : null}
    </>
  );
}

function CardImage({
  src,
  webp,
  alt,
  width,
  height,
  locale,
}: {
  src: string;
  webp: string;
  alt: string;
  width: number;
  height: number;
  locale: ListingLocale;
}) {
  const [failed, setFailed] = useState(false);
  if (failed || isPlaceholderPhoto(src)) {
    return <PhotoPlaceholder locale={locale} />;
  }
  return (
    <picture>
      {webp ? <source srcSet={webp} type="image/webp" /> : null}
      <img src={src} alt={alt} width={width} height={height} onError={() => setFailed(true)} />
    </picture>
  );
}

export function ListingPhoto({
  image,
  imageWebp,
  images,
  locale,
  width,
  height,
  href,
  title,
}: {
  image: string;
  imageWebp: string;
  images?: string[];
  locale: ListingLocale;
  width: number;
  height: number;
  href?: string;
  title: string;
}) {
  const sources = listingPhotoSources([...(images ?? []), image]);
  if (sources.length > 1) {
    const slides: ListingGallerySlide[] = sources.map((src, photoIndex) => ({
      original: src,
      image: src,
      imageWebp: photoIndex === 0 && src === image ? imageWebp : "",
      thumb: src,
      caption: title,
    }));
    return <ListingGallery slides={slides} locale={locale} title={title} variant="compact" />;
  }
  const frame = sources.length === 0 ? (
    <PhotoPlaceholder locale={locale} />
  ) : (
    <CardImage src={sources[0]} webp={sources[0] === image ? imageWebp : ""} alt={title || "Property-photo"} width={width} height={height} locale={locale} />
  );
  if (!href) {
    return frame;
  }
  return <a href={href}>{frame}</a>;
}
