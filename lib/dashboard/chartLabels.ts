/**
 * Which columns of the revenue chart get a label under them.
 *
 * <p>A day is labelled "1 Oct" — about 30px at the axis size. Twenty-seven of
 * them (This month on the 27th) do not fit side by side in the card: they wrapped
 * onto two lines and ran out past its right edge (found 2026-10-27). So past ten
 * columns only every n-th is labelled, about eight across, always starting with
 * the first; every column keeps its place, and the hover still names each one.
 *
 * <p>A plain module, so the chart (in the browser) and its loading screen (on the
 * server) share the rule and the loader's labels sit where the real ones will.
 */
/**
 * The tick gutter's width: one width for every period, and for the loading
 * screen. Sized to each period's widest label, the plot changed width with the
 * period and never matched its loader. Six characters fit "-$1.5k".
 */
export const AXIS_GUTTER = "calc(6ch + 2px)"

export function labelEvery(columns: number): number {
  return columns <= 10 ? 1 : Math.ceil(columns / 8)
}

export function showsLabel(index: number, columns: number): boolean {
  return index % labelEvery(columns) === 0
}
