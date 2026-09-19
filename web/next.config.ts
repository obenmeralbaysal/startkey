import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://nginx";

/**
 * Lookup endpoint names used by the theme runtime's select2 bindings, mapped to the
 * API's lookup groups. The reference website exposes them under
 * `/{lang}/lookup/{name}`, so the same paths are proxied to the Laravel API and the
 * search bar keeps its original network behaviour.
 */
const LOOKUP_ENDPOINTS = [
  "Adtypes",
  "ProcessTypes",
  "Counties",
  "EnteredCountries",
  "EnteredCitiesByCountryId",
  "EnteredOfficeCountries",
  "EnteredOfficeCitiesByCountryId",
  "EnteredConsultantCountries",
  "EnteredConsultantCitiesByCountryId",
  "Currencies",
  "GetAllOffices",
  "Users",
  "Districts",
  "Cities",
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,

  // The reference website sends one complete HTML document with its metadata inside
  // <head>. Next streams metadata after the body unless the client is a bot that
  // cannot handle it, so every request is treated that way and the document is
  // rendered in one piece, exactly as the reference serves it.
  htmlLimitedBots: /.*/,

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBaseUrl}/api/v1/:path*`,
      },
      // Case-insensitive segment as used by the reference markup (`lookup` and `Lookup`).
      ...["lookup", "Lookup"].flatMap((segment) =>
        LOOKUP_ENDPOINTS.map((endpoint) => ({
          source: `/:lang(tr|en|de)/${segment}/${endpoint}`,
          destination: `${apiBaseUrl}/api/v1/lookups/${endpoint}?locale=:lang`,
        })),
      ),
    ];
  },
};

export default nextConfig;
