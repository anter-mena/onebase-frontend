import { parsePhoneNumberFromString } from "libphonenumber-js"

/**
 * Where a client is, read from their phone number.
 *
 * <p>⚠️ <b>A library, not a web service.</b> A number's country is its calling
 * code (+212 is Morocco, +33 France), refined by the leading digits where
 * countries share one (+1 is the US, Canada and much of the Caribbean). That
 * is a lookup in published numbering-plan data, and libphonenumber-js ships
 * the same data — Google's libphonenumber — that the paid lookup APIs answer
 * from. Calling one of those would send every client's phone number to a third
 * party, add a key, a bill and a network hop to every page, and return the
 * same two letters.
 *
 * <p>What a service would add is carrier and line type, which this page does
 * not show. If that is ever wanted it belongs in the backend, called once when
 * a client is saved and stored — not per page view from the browser.
 *
 * <p>Server-side only in practice: the page calls this while rendering and
 * hands the result down, so the numbering data (~145KB) never reaches the
 * browser.
 */

export type ClientCountry = {
  /** ISO 3166-1 alpha-2 — "MA". What the flag is looked up by. */
  code: string
  /** "Morocco". */
  name: string
}

/** Fixed to English like every label here, so server and browser agree. */
const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

/**
 * The country a number belongs to, or `null` when it cannot be told.
 *
 * <p>`null` rather than a guess for a number that is malformed, has no `+`
 * calling code, or sits on a calling code shared by several countries with no
 * leading digits to separate them. A wrong flag is worse than none: it states
 * something about the client that is not true.
 */
export function countryFromPhone(phone: string): ClientCountry | null {
  const parsed = parsePhoneNumberFromString(phone)
  const code = parsed?.country
  if (!code) return null

  return { code, name: regionNames.of(code) ?? code }
}
