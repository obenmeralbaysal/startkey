"use client";

import { useParams } from "next/navigation";

import { OfficeApp } from "@/components/portal/office/OfficeApp";

export default function OfficePage() {
  const params = useParams<{ section?: string | string[] }>();
  const section = params.section;
  const parts = Array.isArray(section) ? section : section ? [section] : [];
  return <OfficeApp parts={parts} />;
}
