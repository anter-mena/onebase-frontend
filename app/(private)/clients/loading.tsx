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
  CLIENT_COLUMNS_COOKIE,
  CLIENT_FIXED_COLUMNS_WIDTH,
  clientColumns,
  parseHiddenColumns,
  type ClientColumnId,
} from "@/lib/clients/columns";

/** Each column's real width class (clientsTable.tsx), and what its cells hold. */
const COLUMN: Record<ClientColumnId, Omit<ColumnSkeleton, "label">> = {
  brand: { className: "w-16", cell: "icon" },
  contact: { className: "w-[17rem]" },
  createdAt: { className: "w-28" },
  subscriptionEnd: { className: "w-28" },
  status: { className: "w-20", cell: "pill" },
  subscription: { className: "w-48" },
  orders: { className: "w-28" },
  paymentMethod: { className: "w-28" },
  revenue: { className: "w-24" },
};

/**
 * Clients while they load. The columns someone hid stay hidden here too — read
 * from the same cookie the page reads — so the table does not drop columns the
 * moment it arrives.
 */
export default async function ClientsLoading() {
  const hidden = new Set(parseHiddenColumns((await cookies()).get(CLIENT_COLUMNS_COOKIE)?.value));
  const shown = clientColumns.filter((column) => !hidden.has(column.id));

  return (
    <PageSkeleton eyebrow="Management" title="Clients" description="View and manage your client relationships.">
      <TableSkeleton
        rows={6}
        minWidth={CLIENT_FIXED_COLUMNS_WIDTH + shown.reduce((sum, column) => sum + column.width, 0)}
        toolbar={
          <>
            <Pills
              active={0}
              options={[
                "All", "New", "Callback", "Trial", "Pending", "Active", "Inactive",
                // Drop wears the destructive ink, as in the real filter.
                { label: "Drop", className: "text-destructive/70" },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <SearchSkeleton />
              <ButtonSkeleton className="w-36" />
              <ButtonSkeleton className="w-7" />
              {/* Add client, where Export CSV was. */}
              <ButtonSkeleton className="w-[5.5rem]" />
            </div>
          </>
        }
        columns={[
          { label: "Client", className: "w-36", cell: "person" },
          ...shown.map((column) => ({ label: column.label, ...COLUMN[column.id] })),
          { label: "Actions", className: "w-20 text-right", cell: "action" },
        ]}
      />
    </PageSkeleton>
  );
}
