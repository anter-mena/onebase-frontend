import type { CardNetwork, ProviderId } from "@/components/settings/paymentMethodCard";

// Sample payment method for the Dashboard card only, until the Dashboard is built.
// Configuration → Payment methods uses real data (lib/paymentMethods).

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
