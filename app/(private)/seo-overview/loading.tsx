import { PageSkeleton } from "@/components/loading/pageSkeleton";
import { SeoSkeleton } from "@/components/seo/seoSkeleton";

/** SEO Overview on the way in: the page's frame, then the content skeleton (seoSkeleton.tsx). */
export default function SeoOverviewLoading() {
  return (
    <PageSkeleton
      eyebrow="Workspace"
      title="SEO Overview"
      description="Each brand's website traffic from Google Analytics 4: every visitor, and what search engines bring."
    >
      {/* It scrolls, like the real page: the same container, the same stable gutter. */}
      <div className="h-full overflow-y-auto p-4 [scrollbar-gutter:stable]">
        <SeoSkeleton />
      </div>
    </PageSkeleton>
  );
}
