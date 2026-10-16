import type { Metadata } from "next";

import { TemplateBuilder } from "@/components/templates/templateBuilder";

export const metadata: Metadata = { title: "New template | One Base" };

export default function NewTemplatePage() {
  return <TemplateBuilder template={null} />;
}
