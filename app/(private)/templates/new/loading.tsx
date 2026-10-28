import { TemplateBuilderSkeleton } from "@/components/templates/templateBuilderSkeleton";

/** A new template starts with one empty text block (templateBuilder.tsx). */
export default function NewTemplateLoading() {
  return <TemplateBuilderSkeleton title="New template" blocks={1} />;
}
