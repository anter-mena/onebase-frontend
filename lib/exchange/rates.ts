"use server"

/**
 * Exchange rates for the currency converter in the navbar.
 *
 * <p>From the free currency-api by fawazahmed0 (served from jsDelivr, with a
 * Cloudflare mirror as a fallback): no key, no limit, about 160 currencies —
 * the Moroccan dirham included, which the European Central Bank list lacks —
 * plus crypto. Rates are published once a day, so the fetch is cached for an
 * hour and shared by everybody who opens the converter.
 *
 * <p>Everything is fetched against USD (the app's currency) and other pairs are
 * worked out from it: one request covers every pair.
 */

const SOURCES = [
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1",
  "https://latest.currency-api.pages.dev/v1",
]

// The API lists hundreds of tokens; only the coins people actually pay with are offered.
const CRYPTO = ["USDT", "USDC", "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "TRX", "LTC", "DOGE", "DAI"]
// ISO codes that are not money anyone pays with (IMF drawing rights).
const NOT_MONEY = new Set(["XDR"])

export type Currency = { code: string; name: string; crypto: boolean }

export type ExchangeRates = {
  /** The publication date, "2026-10-03". */
  date: string
  /** Units of each currency for 1 USD. USD itself is 1. */
  rates: Record<string, number>
  /** Fiat sorted by code, then crypto. */
  currencies: Currency[]
}

async function fetchJson<T>(path: string, revalidate: number): Promise<T> {
  let lastError: unknown
  for (const source of SOURCES) {
    try {
      const response = await fetch(`${source}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(8000) })
      if (response.ok) return (await response.json()) as T
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

export async function getExchangeRates(): Promise<{ ok: true; data: ExchangeRates } | { ok: false; error: string }> {
  try {
    const [latest, names] = await Promise.all([
      fetchJson<{ date: string; usd: Record<string, number> }>("/currencies/usd.json", 3600),
      fetchJson<Record<string, string>>("/currencies.json", 86400),
    ])

    const iso = new Set(Intl.supportedValuesOf("currency"))
    const displayNames = new Intl.DisplayNames("en", { type: "currency" })
    const rates: Record<string, number> = { USD: 1 }
    const fiat: Currency[] = []
    const crypto: Currency[] = []

    for (const [key, rate] of Object.entries(latest.usd)) {
      const code = key.toUpperCase()
      if (!(rate > 0)) continue
      if (iso.has(code) && !NOT_MONEY.has(code)) {
        rates[code] = rate
        fiat.push({ code, name: displayNames.of(code) ?? names[key] ?? code, crypto: false })
      } else if (CRYPTO.includes(code)) {
        rates[code] = rate
        crypto.push({ code, name: names[key] || code, crypto: true })
      }
    }
    rates.USD = 1
    fiat.sort((a, b) => a.code.localeCompare(b.code))
    crypto.sort((a, b) => CRYPTO.indexOf(a.code) - CRYPTO.indexOf(b.code))

    return { ok: true, data: { date: latest.date, rates, currencies: [...fiat, ...crypto] } }
  } catch {
    return { ok: false, error: "The exchange rates could not be loaded. Please try again." }
  }
}
