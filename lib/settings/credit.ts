/**
 * Panel credit: what a plan costs upstream, and what is left in the balance.
 *
 * <p>⚠️ A plain module because two components need the same numbers — the
 * Expenses grid, which shows what each plan spends, and the credit panel beside
 * it, which shows what is left. Holding the rate in one of them and copying it
 * into the other is how "62 lines remaining" and "20 credits a line" end up
 * describing different arithmetic.
 */

export const durations = [1, 3, 6, 12] as const
export const deviceCounts = [1, 2, 3, 4] as const

export type Duration = (typeof durations)[number]

/**
 * Credits for one line, by term.
 *
 * <p>⚠️ Not linear, and it must not be. Panels discount longer terms — twelve
 * months costs 180 rather than 12 × 20 — so a plan's credit cost cannot be
 * derived by multiplying the monthly rate, and anything that tries will
 * overstate every long plan by a third.
 */
export const creditsPerLine: Record<Duration, number> = {
  1: 20,
  3: 55,
  6: 100,
  12: 180,
}

/**
 * What one plan spends.
 *
 * <p>A line is a device, so a four-device plan opens four lines and spends four
 * times the term's rate.
 */
export function planCredits(devices: number, duration: Duration): number {
  return devices * creditsPerLine[duration]
}

/**
 * The balance, and the top-up it came from.
 *
 * <p>Invented, and internally consistent: `remaining` is `total` less what has
 * been spent, and the "lines left" figure the panel prints is `remaining`
 * divided by the one-month rate above rather than a number typed beside it.
 */
export const creditBalance = {
  total: 2000,
  remaining: 1240,
  at: "12 Sep 2026",
}
