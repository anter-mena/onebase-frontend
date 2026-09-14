import type { CardNetwork, ProviderId } from "@/components/settings/paymentMethodCard";
import type { PaymentMethodFormValues } from "@/components/settings/paymentMethodForm";

// Sample payment methods for the interface phase, shared by the list and the edit page.
// Replaced by real data in the logic phase.

export type PaymentMethod = {
  id: ProviderId;
  name: string;
  type: string;
  region: string;
  active: boolean;
  amount: string;
  currency: string;
  holder: string;
  networks: readonly CardNetwork[];
};

export const paymentMethods: readonly PaymentMethod[] = [
  { id: "paypal", name: "Main PayPal", type: "Digital wallet", region: "ONLINE", active: true, amount: "12,480.50", currency: "USD", holder: "Admin User", networks: ["Mastercard"] },
  { id: "interac", name: "Interac e-Transfer", type: "e-Transfer", region: "CANADA", active: false, amount: "8,215.00", currency: "CAD", holder: "Admin User", networks: ["Visa"] },
  { id: "crypto", name: "Binance Wallet", type: "Cryptocurrency", region: "ON-CHAIN", active: true, amount: "3,940.25", currency: "USDT", holder: "Admin User", networks: ["Visa", "Mastercard"] },
  { id: "other", name: "Bank Transfer", type: "Other method", region: "WORLDWIDE", active: true, amount: "5,300.00", currency: "EUR", holder: "Admin User", networks: ["Visa", "Mastercard"] },
];

export function findPaymentMethod(id: string) {
  return paymentMethods.find((method) => method.id === id);
}

// A saved method, turned into the values the form starts with on the edit page.
// Lives here rather than in the form: the form is a Client Component, and the edit page calls this on the server.
export function toFormValues(method: PaymentMethod): PaymentMethodFormValues {
  const hasVisa = method.networks.includes("Visa");
  const hasMastercard = method.networks.includes("Mastercard");

  return {
    // The card's provider "crypto" is the form's type "binance".
    type: method.id === "crypto" ? "binance" : method.id,
    methodName: method.name,
    holder: method.holder,
    balance: Number(method.amount.replaceAll(",", "")),
    networkChoice: hasVisa && hasMastercard ? "both" : hasVisa ? "visa" : "mastercard",
    status: method.active ? "active" : "inactive",
    // USDT is not a choice in the form: Binance locks the currency to USDT on its own.
    currency: method.currency === "CAD" || method.currency === "EUR" ? method.currency : "USD",
    instructions: "",
  };
}
