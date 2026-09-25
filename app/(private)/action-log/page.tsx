import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ActionLogTable } from "@/components/action-log/actionLogTable";
import {
  ACTION_LOG_COLUMNS_COOKIE,
  parseHiddenColumns,
} from "@/lib/action-log/columns";

export const metadata: Metadata = {
  title: "Action log | One Base",
};

export default async function ActionLogPage() {
  /**
   * ⚠️ Read here, not in the table. A stored preference resolved after the
   * first paint is one the reader watches being applied — every column drawn
   * and some taken away as React hydrates. The cookie name and the parser come
   * from `lib/action-log/columns`, a plain module, because a `"use client"`
   * file's exports reach a server component as references rather than values.
   */
  const cookieStore = await cookies();
  const hiddenColumns = parseHiddenColumns(cookieStore.get(ACTION_LOG_COLUMNS_COOKIE)?.value);

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0">
        <p className="text-xs font-medium text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Action log</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Every change made in this workspace, and who made it.
        </p>
      </header>

      {/* The same shell the Clients page uses: the table owns its own toolbar
          and footer, so the section is just the frame around it. */}
      <section
        className="mt-4 min-h-0 flex-1 overflow-hidden rounded-xl border bg-background"
        aria-label="Action log content"
      >
        <ActionLogTable defaultHiddenColumns={hiddenColumns} />
      </section>
    </div>
  );
}
