import {
  ButtonSkeleton,
  PageSkeleton,
  Pills,
  SearchSkeleton,
  TableSkeleton,
} from "@/components/loading/pageSkeleton";

/** Renewals while they load: the group pills, then the same columns as renewalsTable.tsx. */
export default function RenewalsLoading() {
  return (
    <PageSkeleton
      eyebrow="Management"
      title="Renewals"
      description="Plans ending soon, trials to call back, payments we are waiting for, and plans that ended."
    >
      <TableSkeleton
        rows={6}
        toolbarClassName="flex-col lg:flex-row lg:items-center"
        minWidth={860}
        toolbar={
          <>
            {/* Each group with its count bubble. The bubble is there at its real size,
                but empty: a count is data, and a made-up "0" would be a lie. */}
            <Pills
              active={0}
              options={["All", "Ending soon", "Callback", "Pending", "Inactive"].map((label) => ({
                label: (
                  <>
                    {label}
                    <span className="rounded-full bg-foreground/10 px-1.5 text-[0.6rem] text-transparent tabular-nums">00</span>
                  </>
                ),
              }))}
            />
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <ButtonSkeleton className="w-44" />
              <SearchSkeleton />
              <ButtonSkeleton className="w-24" />
            </div>
          </>
        }
        columns={[
          { label: "Client", className: "w-48", cell: "person" },
          { label: "Brand", className: "w-16", cell: "icon" },
          { label: "Contact", className: "w-56 2xl:w-[23rem]" },
          { label: "When", className: "w-44" },
          { label: "Status", className: "w-28", cell: "pill" },
          { label: "Subscription", className: "w-48" },
          { label: "Actions", className: "w-20 text-right", cell: "action" },
        ]}
      />
    </PageSkeleton>
  );
}
