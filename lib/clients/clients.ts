import "server-only"

import { parsePhoneNumberFromString } from "libphonenumber-js"

import { apiFetch, type ApiResult } from "@/lib/api"
import { planDescription, type Client, type ClientTransaction } from "@/lib/clients/sample"
import { providerLabels, statusFromBackend, type ApiClient, type ApiPayment } from "@/lib/clients/types"

/**
 * The Clients screens' loaders: `GET /api/clients` and one client. Both roles.
 *
 * <p>Server-only, so the phone formatting data (libphonenumber-js) stays out of
 * the browser bundle.
 */

export async function getClients(): Promise<ApiResult<Client[]>> {
  const result = await apiFetch<ApiClient[]>("/api/clients", { authenticated: true })
  return result.ok ? { ok: true, data: result.data.map(toClient) } : result
}

/** A client's payments, newest first, as the ledger draws them. */
export async function getPayments(clientId: number): Promise<ApiResult<ClientTransaction[]>> {
  const result = await apiFetch<ApiPayment[]>(`/api/clients/${clientId}/payments`, { authenticated: true })
  return result.ok ? { ok: true, data: result.data.map(toTransaction) } : result
}

export async function getClient(id: number): Promise<ApiResult<Client>> {
  const result = await apiFetch<ApiClient>(`/api/clients/${id}`, { authenticated: true })
  return result.ok ? { ok: true, data: toClient(result.data) } : result
}

/**
 * The avatar tints, picked by id so a client keeps theirs. The same twelve the
 * interface phase used.
 */
const AVATAR_TINTS = [
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-fuchsia-100 text-fuchsia-800",
  "bg-cyan-100 text-cyan-800",
  "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-800",
  "bg-pink-100 text-pink-800",
  "bg-lime-100 text-lime-800",
  "bg-teal-100 text-teal-800",
]

/** "Sara Amrani" → "SA"; a name that is only a phone number → its last two digits. */
function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => /\p{L}/u.test(word))
  if (words.length === 0) return name.replace(/\D/g, "").slice(-2) || "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** "+212612345678" → "+212 6 12 34 56 78": grouped for reading, never for storing. */
function displayPhone(e164: string | null): string {
  if (!e164) return ""
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164
}

/** "2026-09-29" → "Sep 29, 2026", the table's way. A calendar date: read in UTC so it never moves. */
const endFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" })
const endLabel = (iso: string) => endFormatter.format(new Date(`${iso}T00:00:00Z`))

function toTransaction(payment: ApiPayment): ClientTransaction {
  const extras = payment.perks.map((perk) => `${perk.name} ×${perk.quantity}`).join(", ")
  return {
    id: String(payment.id),
    at: payment.paidOn,
    kind: payment.kind === "NEW_PLAN" ? "New plan" : "Renewal",
    description: planDescription(payment.months, payment.devices) + (extras ? ` + ${extras}` : ""),
    months: payment.months,
    devices: payment.devices,
    method: payment.paymentProvider ? providerLabels[payment.paymentProvider] : "Not set",
    account: payment.paymentMethodName ?? undefined,
    brand: payment.brandName ?? "",
    brandLogo: payment.brandLogoUrl ?? "",
    amount: payment.amount,
    expense: payment.expense,
    startsOn: payment.startsOn,
    endsOn: payment.endsOn,
  }
}

/** The API's client in the shape every Clients screen draws. */
function toClient(api: ApiClient): Client {
  return {
    id: api.id,
    name: api.name,
    initials: initialsFor(api.name),
    email: api.email ?? undefined,
    phone: displayPhone(api.phone),
    brand: api.brandName ?? "No brand",
    brandLogo: api.brandLogoUrl ?? "",
    // From their payments, worked out by the backend.
    subscriptionEnd: api.subscriptionEnd ? endLabel(api.subscriptionEnd) : "",
    subscriptionEndAt: api.subscriptionEnd ?? "",
    devices: api.devices ?? 0,
    duration: api.months ? `${api.months} ${api.months === 1 ? "month" : "months"}` : "",
    orders: api.orders,
    orderTrend: api.orderTrend,
    paymentMethod: api.paymentProvider ? providerLabels[api.paymentProvider] : "Not set",
    revenue: api.revenue,
    status: statusFromBackend[api.status],
    color: AVATAR_TINTS[api.id % AVATAR_TINTS.length],
    note: api.note ?? undefined,
    fullName: api.fullName,
    username: api.username,
    phoneE164: api.phone,
    countryCode: api.country,
    brandId: api.brandId,
    source: api.source,
    conversationId: api.conversationId,
    createdAt: api.createdAt,
  }
}

/** One payment and its client, for the printed receipt. A 404 when either is gone. */
export async function getPaymentReceipt(
  clientId: number,
  paymentId: number,
): Promise<ApiResult<{ client: ApiClient; payment: ApiPayment }>> {
  const [client, payments] = await Promise.all([
    apiFetch<ApiClient>(`/api/clients/${clientId}`, { authenticated: true }),
    apiFetch<ApiPayment[]>(`/api/clients/${clientId}/payments`, { authenticated: true }),
  ])
  if (!client.ok) return client
  if (!payments.ok) return payments
  const payment = payments.data.find((entry) => entry.id === paymentId)
  if (!payment) return { ok: false, error: { status: 404, error: "Not Found", message: "This payment does not exist." } }
  return { ok: true, data: { client: client.data, payment } }
}
