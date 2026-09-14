// Cards or table on the payment methods page, remembered in a cookie.
// A cookie rather than localStorage: the server reads it and renders the right view in the first HTML,
// so a saved "table" no longer shows the cards for a moment before switching.

export type PaymentMethodsView = "cards" | "table";

/** Read by the settings page on the server, written by the view switch in the browser. */
export const PAYMENT_METHODS_VIEW_COOKIE = "payment_methods_view";

/** A year. It is a preference, not a session. */
export const PAYMENT_METHODS_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Anything missing or unexpected falls back to cards, the default. */
export function parsePaymentMethodsView(raw: string | undefined): PaymentMethodsView {
  return raw === "table" ? "table" : "cards";
}
