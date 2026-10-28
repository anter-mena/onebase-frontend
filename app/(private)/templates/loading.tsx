import {
  ButtonSkeleton,
  PageSkeleton,
  Pills,
  SearchSkeleton,
  TableSkeleton,
} from "@/components/loading/pageSkeleton";

/** Templates while they load: the status pills, search, New template, then the columns of templatesTable.tsx. */
export default function TemplatesLoading() {
  return (
    <PageSkeleton
      eyebrow="Communication"
      title="Templates"
      description="Ready-made WhatsApp messages the team sends from the inbox, within 24 hours of the client's last message."
    >
      <TableSkeleton
        minWidth={896}
        rows={8}
        footer="count"
        toolbar={
          <>
            <Pills active={0} options={["All", "Active", "Inactive"]} />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <SearchSkeleton className="sm:w-56" />
              <ButtonSkeleton className="w-28" />
            </div>
          </>
        }
        columns={[
          { label: "Name", className: "w-56" },
          { label: "Language", className: "w-24", cell: "pill" },
          { label: "Content" },
          { label: "Status", className: "w-32", cell: "pill" },
          { label: "Updated", className: "w-44" },
        ]}
      />
    </PageSkeleton>
  );
}
