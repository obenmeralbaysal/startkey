"use client";

import { useEffect } from "react";

/**
 * Loads the reference website's own front-end runtime (jQuery, then the vendor
 * bundle with Bootstrap/AOS/select2/Fancybox, then the theme bundle with
 * owl.carousel/odometer and the initialisation code) so that carousels, the
 * sticky header, dropdowns, counters and scroll animations behave exactly as on
 * the reference website.
 *
 * The bundles are loaded sequentially after hydration: they mutate the DOM that
 * React has already rendered, so they must not run before hydration completes.
 */
const BUNDLES = ["/js/jquery-3.7.1.min.js", "/js/bundle-vendor.js", "/js/bundle-app.js"];

const LOADED_ATTRIBUTE = "data-startkey-theme-runtime";

export function ThemeScripts() {
  useEffect(() => {
    let cancelled = false;

    const loadSequentially = async () => {
      for (const src of BUNDLES) {
        if (cancelled) {
          return;
        }
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing) {
          if (existing.dataset.loaded !== "1") {
            await new Promise<void>((resolve, reject) => {
              existing.addEventListener(
                "load",
                () => {
                  existing.dataset.loaded = "1";
                  resolve();
                },
                { once: true },
              );
              existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
                once: true,
              });
            });
          }
          continue;
        }
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.async = false;
          script.setAttribute(LOADED_ATTRIBUTE, "");
          script.addEventListener("load", () => {
            script.dataset.loaded = "1";
            resolve();
          });
          script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
          document.body.appendChild(script);
        });
      }
    };

    loadSequentially()
      .then(() => {
        if (cancelled) {
          return;
        }
        // Bootstrap, AOS and Fancybox all fall back to initialising immediately when
        // the document is already parsed. Odometer only listens for
        // `DOMContentLoaded`, which has fired by the time the bundles arrive here, so
        // its counters are initialised explicitly to get the reference's markup and
        // scroll-in animation.
        window.Odometer?.init();
        // The theme sticky handler only runs on `scroll`. Fire once so the header
        // matches the current offset instead of waiting for the next wheel event.
        window.dispatchEvent(new Event("scroll"));
      })
      .catch((error) => {
        console.error("Theme runtime could not be initialised", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
