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
  USER_COLUMNS_COOKIE,
  USER_FIXED_COLUMNS_WIDTH,
  parseHiddenColumns,
  userColumns,
  type UserColumnId,
} from "@/lib/users/columns";

/** Each column's real width class (usersTable.tsx), and what its cells hold. */
const COLUMN: Record<UserColumnId, Omit<ColumnSkeleton, "label">> = {
  role: { className: "w-28", cell: "pill" },
  status: { className: "w-36", cell: "pill" },
  lastActive: { className: "w-44" },
  added: { className: "w-32" },
};

/** Users while they load, with the columns someone hid still hidden (same cookie as the page). */
export default async function UsersLoading() {
  const hidden = new Set(parseHiddenColumns((await cookies()).get(USER_COLUMNS_COOKIE)?.value));
  const shown = userColumns.filter((column) => !hidden.has(column.id));

  return (
    <PageSkeleton
      eyebrow="Administration"
      title="Users"
      description="Who can sign in to this workspace, and what they can reach."
    >
      <TableSkeleton
        rows={6}
        minWidth={USER_FIXED_COLUMNS_WIDTH + shown.reduce((sum, column) => sum + column.width, 0)}
        toolbar={
          <>
            <Pills active={0} options={["All", "Admin", "Commercial"]} />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {/* Search, dates, Invite user, Export CSV, then the columns button. */}
              <SearchSkeleton className="sm:w-56" />
              <ButtonSkeleton className="w-36" />
              <ButtonSkeleton className="w-24" />
              <ButtonSkeleton className="w-24" />
              <ButtonSkeleton className="w-7" />
            </div>
          </>
        }
        columns={[
          { label: "", className: "w-8", cell: "checkbox" },
          { label: "User", className: "w-56", cell: "person" },
          ...shown.map((column) => ({ label: column.label, ...COLUMN[column.id] })),
          { label: "Actions", className: "w-20 text-right", cell: "action" },
        ]}
      />
    </PageSkeleton>
  );
}
