import { TemplateBuilderSkeleton } from "@/components/templates/templateBuilderSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** The title is the template's own name, so it is grey until the template arrives; it has its own blocks — two are drawn. */
export default function EditTemplateLoading() {
  return <TemplateBuilderSkeleton title={<Skeleton className="my-1 h-6 w-48" />} blocks={2} />;
}
