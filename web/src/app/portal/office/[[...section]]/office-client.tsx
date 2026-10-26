"use client";

import { OfficeApp } from "@/components/portal/office/OfficeApp";

export function OfficePageClient({ parts }: { parts: string[] }) {
  return <OfficeApp parts={parts} />;
}
