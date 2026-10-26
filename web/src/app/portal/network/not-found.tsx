import type { Metadata } from "next";

import { OfficeMissing } from "@/components/portal/network/OfficeMissing";

export const metadata: Metadata = {
  title: "404",
};

export default function NetworkOfficeNotFound() {
  return <OfficeMissing />;
}
