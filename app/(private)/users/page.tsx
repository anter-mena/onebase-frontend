import type { Metadata } from "next";
import { cookies } from "next/headers";

import { UsersTable } from "@/components/users/usersTable";
import { USER_COLUMNS_COOKIE, parseHiddenColumns } from "@/lib/users/columns";
import { getUsers } from "@/lib/users/users";

export const metadata: Metadata = {
  title: "Users | One Base",
};

export default async function UsersPage() {
  /**
   * ⚠️ Read here, not in the table. A stored preference resolved after the
   * first paint is one the reader watches being applied. The cookie name and
   * the parser come from `lib/users/columns`, a plain module, because a
   * `"use client"` file's exports reach a server component as references
   * rather than values.
   */
  const cookieStore = await cookies();
  const hiddenColumns = parseHiddenColumns(cookieStore.get(USER_COLUMNS_COOKIE)?.value);
  // The real accounts, asked fresh on every visit (and again after each change).
  const users = await getUsers();

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Who can sign in to this workspace, and what they can reach.
        </p>
      </header>

      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Users content"
      >
        {users.ok ? (
          <UsersTable users={users.data} defaultHiddenColumns={hiddenColumns} />
        ) : (
          // Not an empty table: "no users" would be a lie when the list simply did not load.
          <div role="alert" className="flex h-full min-h-48 items-center justify-center px-6 text-center text-xs text-muted-foreground">
            The user list could not be loaded. {users.error.message}
          </div>
        )}
      </section>
    </div>
  );
}
