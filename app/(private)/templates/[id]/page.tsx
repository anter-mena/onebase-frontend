import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LoadError } from "@/components/errors/loadError";
import { TemplateBuilder } from "@/components/templates/templateBuilder";
import { getTemplate } from "@/lib/templates/templates";

export const metadata: Metadata = { title: "Edit template | One Base" };

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // A 404 rather than an empty builder: a URL naming a template that is not here is wrong.
  if (!/^\d+$/.test(id)) notFound();
  const result = await getTemplate(id);
  if (!result.ok && result.error.status === 404) notFound();

  if (!result.ok) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <LoadError title="This template could not be loaded." reason={result.error.message} />
      </div>
    );
  }

  // Keyed by the save time: after a save the builder starts again from what is stored.
  return <TemplateBuilder key={result.data.updatedAt} template={result.data} />;
}
