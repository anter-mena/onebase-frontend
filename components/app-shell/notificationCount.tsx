/** Past this the badge says "+99": the area itself shows the real number. */
export const MAX_SHOWN_COUNT = 99;

/** "+1" … "+99". */
export function countLabel(count: number) {
  return `+${Math.min(count, MAX_SHOWN_COUNT)}`;
}

/**
 * A sidebar area's red count (2026-10-28): small, flashing gently, at the end of the
 * row; on the icon's corner when the sidebar is folded to icons. Nothing at 0.
 * `label` is what screen readers hear after the number ("unread emails"), read
 * with the link rather than announced on its own every minute.
 */
export function NotificationCount({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="relative z-10 ml-auto flex shrink-0 overflow-visible! whitespace-nowrap! group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:right-0">
      <span
        aria-hidden
        className="notif-flash inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] leading-none font-semibold text-white tabular-nums ring-1 ring-background group-data-[collapsible=icon]:h-3.5 group-data-[collapsible=icon]:min-w-3.5 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:text-[0.5rem]"
      >
        {countLabel(count)}
      </span>
      <span className="sr-only">
        , {count > MAX_SHOWN_COUNT ? "more than 99" : count} {label}
      </span>
    </span>
  );
}
