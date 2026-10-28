import { cookies } from "next/headers";

import {
  ButtonSkeleton,
  PageSkeleton,
  Pills,
  SearchSkeleton,
  TableSkeleton,
  type ColumnSkeleton,
} from "@/components/loading/pageSkeleton";
import {
  ACTION_LOG_COLUMNS_COOKIE,
  ACTION_LOG_FIXED_COLUMNS_WIDTH,
  actionLogColumns,
  parseHiddenColumns,
  type ActionLogColumnId,
} from "@/lib/action-log/columns";

/** Each column's real width class (actionLogTable.tsx), and what its cells hold. */
const COLUMN: Record<ActionLogColumnId, Omit<ColumnSkeleton, "label">> = {
  action: { className: "w-32", cell: "pill" },
  target: { className: "w-56" },
  detail: { className: "w-[20rem]" },
  source: { className: "w-24" },
  ip: { className: "w-32" },
};

/** The Action log while it loads, with the columns someone hid still hidden (same cookie as the page). */
export default async function ActionLogLoading() {
  const hidden = new Set(parseHiddenColumns((await cookies()).get(ACTION_LOG_COLUMNS_COOKIE)?.value));
  const shown = actionLogColumns.filter((column) => !hidden.has(column.id));

  return (
    <PageSkeleton
      eyebrow="Administration"
      title="Action log"
      description="Every change made in this workspace, and who made it."
    >
      <TableSkeleton
        rows={6}
        minWidth={ACTION_LOG_FIXED_COLUMNS_WIDTH + shown.reduce((sum, column) => sum + column.width, 0)}
        toolbar={
          <>
            <Pills
              active={0}
              options={["All", "Created", "Updated", "Activated", "Deactivated", "Deleted", "Exported", "Signed in"]}
            />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <SearchSkeleton />
              <ButtonSkeleton className="w-36" />
              <ButtonSkeleton className="w-7" />
              <ButtonSkeleton className="w-24" />
            </div>
          </>
        }
        columns={[
          { label: "When", className: "w-40" },
          { label: "Who", className: "w-44", cell: "actor" },
          ...shown.map((column) => ({ label: column.label, ...COLUMN[column.id] })),
        ]}
      />
    </PageSkeleton>
  );
}
