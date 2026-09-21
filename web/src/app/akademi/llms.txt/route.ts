import { akademiLlms } from "@/content/seo/llms";
import { absolutizeLlms, textResponse } from "@/lib/seo-xml";
import { siteOrigin } from "@/lib/site-origin";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = await siteOrigin();
  return textResponse(absolutizeLlms(origin, akademiLlms));
}
