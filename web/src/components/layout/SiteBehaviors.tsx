"use client";

import { useEffect } from "react";

type LookupItem = { id: string | number; text: string };

function perView(): number {
  const width = window.innerWidth;
  if (width >= 1200) return 3;
  if (width >= 768) return 2;
  return 1;
}

async function fillSelect(select: HTMLSelectElement, url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return;
  const payload = (await response.json()) as { items?: LookupItem[] };
  const items = payload.items ?? [];
  const current = select.value;
  select.replaceChildren();
  for (const item of items) {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.text;
    select.appendChild(option);
  }
  if (current && [...select.options].some((option) => option.value === current)) {
    select.value = current;
  }
}

function bindLookups(root: ParentNode) {
  const selects = [...root.querySelectorAll<HTMLSelectElement>("select[bind-url]")];
  for (const select of selects) {
    select.classList.add("sk-field");
    const url = select.getAttribute("bind-url") ?? "";
    const bindId = select.getAttribute("bind-id");
    const bindQuery = select.getAttribute("bind-query");
    const load = () => {
      let next = url;
      if (bindId && bindQuery) {
        const parent = document.getElementById(bindId) as HTMLSelectElement | null;
        const value = parent?.value ?? "";
        next = value ? `${url}?${encodeURIComponent(bindQuery)}=${encodeURIComponent(value)}` : url;
      }
      void fillSelect(select, next);
    };
    load();
    if (bindId) {
      document.getElementById(bindId)?.addEventListener("change", load);
    }
  }
  root.querySelectorAll("select").forEach((select) => select.classList.add("sk-field"));
}

function bindCarousel(node: HTMLElement, mode: "cards" | "single") {
  if (node.dataset.skReady === "1") return;
  node.dataset.skReady = "1";
  const slides = [...node.children] as HTMLElement[];
  if (slides.length === 0) return;
  let index = 0;
  const apply = () => {
    const count = mode === "single" ? 1 : perView();
    const width = 100 / count;
    node.style.display = "flex";
    node.style.flexWrap = "nowrap";
    node.style.overflow = "hidden";
    slides.forEach((slide, slideIndex) => {
      slide.style.flex = `0 0 ${width}%`;
      slide.style.transform = `translateX(-${index * 100}%)`;
      slide.style.display = slideIndex >= index && slideIndex < index + count ? "" : "";
    });
  };
  const dots = document.createElement("div");
  dots.className = "sk-dots";
  const renderDots = () => {
    dots.replaceChildren();
    const count = mode === "single" ? 1 : perView();
    const pages = Math.max(1, Math.ceil(slides.length / count));
    for (let page = 0; page < pages; page += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = page === index ? "is-active" : "";
      button.append(document.createElement("span"));
      button.addEventListener("click", () => {
        index = page;
        apply();
        renderDots();
      });
      dots.appendChild(button);
    }
  };
  if (mode === "single") {
    const prev = document.createElement("button");
    const next = document.createElement("button");
    prev.type = "button";
    next.type = "button";
    prev.className = next.className = "absolute top-1/2 z-[2] flex h-[calc(38px*var(--sk-scale,1))] w-[calc(38px*var(--sk-scale,1))] -translate-y-1/2 items-center justify-center bg-navy/45 text-white";
    prev.classList.add("left-[calc(10px*var(--sk-scale,1))]");
    next.classList.add("right-[calc(10px*var(--sk-scale,1))]");
    prev.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
    next.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
    prev.addEventListener("click", () => {
      index = (index - 1 + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.style.display = slideIndex === index ? "block" : "none";
      });
    });
    next.addEventListener("click", () => {
      index = (index + 1) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.style.display = slideIndex === index ? "block" : "none";
      });
    });
    node.classList.add("relative");
    slides.forEach((slide, slideIndex) => {
      slide.style.width = "100%";
      slide.style.height = "auto";
      slide.style.opacity = "1";
      slide.style.display = slideIndex === 0 ? "block" : "none";
    });
    node.append(prev, next);
    return;
  }
  node.after(dots);
  apply();
  renderDots();
  window.addEventListener("resize", () => {
    apply();
    renderDots();
  });
}

function bindLightbox() {
  const dialog = document.createElement("dialog");
  dialog.className = "m-auto max-w-[calc(960px*var(--sk-scale,1))] bg-transparent p-0 backdrop:bg-black/70";
  dialog.addEventListener("click", () => dialog.close());
  document.body.append(dialog);
  document.querySelectorAll<HTMLElement>("[data-fancybox]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      const href = node.getAttribute("href") || node.getAttribute("data-src") || "";
      dialog.replaceChildren();
      if (href.includes("youtube") || href.endsWith(".mp4")) {
        const frame = document.createElement("iframe");
        frame.src = href;
        frame.className = "h-[calc(540px*var(--sk-scale,1))] w-[calc(960px*var(--sk-scale,1))] max-w-full";
        frame.allow = "autoplay; fullscreen";
        dialog.append(frame);
      } else if (href) {
        const image = document.createElement("img");
        image.src = href;
        image.alt = node.getAttribute("data-caption") || "";
        dialog.append(image);
      }
      dialog.showModal();
    });
  });
}

function bindMotion() {
  const nodes = document.querySelectorAll<HTMLElement>("[data-aos]");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target as HTMLElement;
      const motion = target.dataset.aos;
      const name =
        motion === "fade-left" ? "sk-fade-left" : motion === "fade-right" ? "sk-fade-right" : "sk-fade-up";
      const duration = Number(target.dataset.aosDuration || "700");
      const delay = Number(target.dataset.aosDelay || "0");
      target.style.animation = `${name} ${duration}ms ease ${delay}ms both`;
      observer.unobserve(target);
    });
  });
  nodes.forEach((node) => {
    node.style.opacity = "0";
    observer.observe(node);
  });

  document.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count || "0");
    const counter = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      const started = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / 1200);
        node.textContent = String(Math.round(target * progress));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counter.disconnect();
    });
    counter.observe(node);
  });
}

function bindFaq() {
  document.querySelectorAll<HTMLButtonElement>(".sk-faq-item button[data-bs-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-bs-target");
      if (!target) return;
      const panel = document.querySelector<HTMLElement>(target);
      if (!panel) return;
      const open = panel.classList.contains("show");
      document.querySelectorAll<HTMLElement>(".sk-faq-item .collapse").forEach((node) => {
        node.classList.remove("show");
        const control = document.querySelector<HTMLButtonElement>(`[data-bs-target="#${node.id}"]`);
        control?.classList.add("collapsed");
        control?.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        panel.classList.add("show");
        button.classList.remove("collapsed");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function bindBackToTop() {
  const link = document.querySelector<HTMLElement>("[data-back-to-top]");
  if (!link) return;
  const onScroll = () => {
    const open = window.scrollY > 240;
    link.classList.toggle("hidden", !open);
    link.style.bottom = open ? "calc(30px * var(--sk-scale, 1))" : "calc(230px * var(--sk-scale, 1))";
  };
  link.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/**
 * Public interactions that used to live in the jQuery theme bundle: lookup selects,
 * carousels, the video/gallery lightbox, scroll counters and back-to-top.
 */
export function SiteBehaviors() {
  useEffect(() => {
    bindLookups(document);
    document.querySelectorAll<HTMLElement>("[data-carousel='cards']").forEach((node) => bindCarousel(node, "cards"));
    document.querySelectorAll<HTMLElement>("[data-carousel='single']").forEach((node) => bindCarousel(node, "single"));
    bindLightbox();
    bindMotion();
    bindFaq();
    bindBackToTop();
  }, []);

  return null;
}
