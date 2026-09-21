"use client";

import { CorporateHttpErrorClient } from "@/components/corporate/CorporateHttpErrorClient";

export default function LocaleError() {
  return <CorporateHttpErrorClient code={500} />;
}
