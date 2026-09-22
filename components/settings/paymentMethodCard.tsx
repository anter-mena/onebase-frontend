import { Fragment } from "react";
import { WalletCards } from "lucide-react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { cn } from "cn";

import { CreditCard, CreditCardFront, CreditCardName } from "@/components/kibo-ui/credit-card";
import styles from "./paymentMethods.module.css";

// The card design, shared by the payment methods list and the live preview on the add page.

export type ProviderId = "paypal" | "interac" | "crypto" | "other";
export type CardNetwork = "Visa" | "Mastercard";

// Monochrome provider logos, tinted with the text color through a CSS mask.
export const providerLogos: Record<ProviderId, { name: string; src: string | null }> = {
  paypal: { name: "PayPal", src: "/brands/paypal.svg" },
  // The hand from the official Interac logo, cut out without the text and the yellow square.
  interac: { name: "Interac", src: "/brands/interac-hand.png" },
  crypto: { name: "Binance", src: "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/binance.svg" },
  // Any other method has no brand, so a wallet icon stands in (see ProviderLogo).
  other: { name: "Other", src: null },
};

// Lucide's Nfc icon, one path per wave, from the smallest (left) to the largest (right).
const contactlessWaves = [
  "M6 8.32a7.43 7.43 0 0 1 0 7.36",
  "M9.46 6.21a11.76 11.76 0 0 1 0 11.58",
  "M12.91 4.1a15.91 15.91 0 0 1 .01 15.8",
  "M16.37 2a20.16 20.16 0 0 1 0 20",
];

// Active cards: each wave flashes green in turn, left to right. Inactive cards: plain white.
function ContactlessIcon({ active, className }: { active: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} role="img" aria-label={active ? "Active" : "Inactive"}>
      {contactlessWaves.map((d, index) => (
        <path key={d} d={d} className={cn(styles.wave, active && styles.waveActive)} style={active ? { animationDelay: `${index * 150}ms` } : undefined} />
      ))}
    </svg>
  );
}

// The Canadian maple leaf, drawn as an outline only.
// Path: Font Awesome Free "canadian-maple-leaf" (fontawesome.com), CC BY 4.0.
function MapleLeafOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="maple-leaf-stroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.7" />
          <stop offset="100%" stopColor="white" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path
        stroke="url(#maple-leaf-stroke)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        d="M383.8 351.7c2.5-2.5 105.2-92.4 105.2-92.4l-17.5-7.5c-10-4.9-7.4-11.5-5-17.4c2.4-7.6 20.1-67.3 20.1-67.3s-47.7 10-57.7 12.5c-7.5 2.4-10-2.5-12.5-7.5s-15-32.4-15-32.4s-52.6 59.9-55.1 62.3c-10 7.5-20.1 0-17.6-10c0-10 27.6-129.6 27.6-129.6s-30.1 17.4-40.1 22.4c-7.5 5-12.6 5-17.6-5C293.5 72.3 255.9 0 255.9 0s-37.5 72.3-42.5 79.8c-5 10-10 10-17.6 5c-10-5-40.1-22.4-40.1-22.4S183.3 182 183.3 192c2.5 10-7.5 17.5-17.6 10c-2.5-2.5-55.1-62.3-55.1-62.3S98.1 167 95.6 172s-5 9.9-12.5 7.5C73 177 25.4 167 25.4 167s17.6 59.7 20.1 67.3c2.4 6 5 12.5-5 17.4L23 259.3s102.6 89.9 105.2 92.4c5.1 5 10 7.5 5.1 22.5c-5.1 15-10.1 35.1-10.1 35.1s95.2-20.1 105.3-22.6c8.7-.9 18.3 2.5 18.3 12.5S241 512 241 512h30s-5.8-102.7-5.8-112.8s9.5-13.4 18.4-12.5c10 2.5 105.2 22.6 105.2 22.6s-5-20.1-10-35.1s0-17.5 5-22.5"
      />
    </svg>
  );
}

// Two translucent white circles: where they overlap reads brighter, like the real mark on a dark card.
function MastercardMark() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto" role="img" aria-label="Mastercard">
      <circle cx="12" cy="12" r="12" fill="white" fillOpacity="0.55" />
      <circle cx="26" cy="12" r="12" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

// compact: the small version used in the table, where a long name does not fit (Interac shows its initial).
export function ProviderLogo({ id, compact = false }: { id: ProviderId; compact?: boolean }) {
  const logo = providerLogos[id];
  if (id === "other") {
    // The same wallet icon as the "Add new method" card.
    return <WalletCards role="img" aria-label={logo.name} strokeWidth={1.75} className={cn("text-white/80", compact ? "size-4" : "size-7")} />;
  }
  // The logo alone when there is one; the name only stands in when there is not.
  return logo.src ? (
    <span role="img" aria-label={logo.name} className={cn("block bg-white/80", compact ? "size-4" : "size-7")} style={{ mask: `url(${logo.src}) center / contain no-repeat`, WebkitMask: `url(${logo.src}) center / contain no-repeat` }} />
  ) : (
    <span className={cn("font-bold tracking-tight text-white/80", compact ? "text-xs" : "text-sm")}>{compact ? logo.name[0] : logo.name}</span>
  );
}

export type PaymentMethodCardProps = {
  provider: ProviderId;
  active: boolean;
  methodName: string;
  amount: string;
  currency: string;
  holder: string;
  networks: readonly CardNetwork[];
};

export function PaymentMethodCard({ provider, active, methodName, amount, currency, holder, networks }: PaymentMethodCardProps) {
  return (
    // Kibo UI credit card (kibo-ui.com) as a plain metal card.
    // The original card size (full column width, 192px tall) instead of Kibo's bank card proportions.
    // styles.fixed: the card keeps the default look under every theme and in
    // dark — see the note beside the class.
    <CreditCard className={cn(styles.fixed, "aspect-auto min-h-48 max-w-none flex-1 text-white")}>
      {/* Each method has its own background; platinum until one is designed. */}
      <CreditCardFront safeArea={20} className={cn(styles.card, styles[provider] ?? styles.metal)}>
        {/* Binance only: its large logo behind everything, cropped by the card edge. First, so the content paints over it. */}
        {provider === "crypto" ? (
          // Two layers: the logo shape is already a mask, so the side fade sits on a wrapper around it.
          <span aria-hidden className={cn(styles.fade, "pointer-events-none absolute -top-12 -right-14 size-60")}>
            <span className={cn(styles.cryptoMark, "block size-full")} />
          </span>
        ) : null}

        {/* Interac only: its large hand behind everything, cropped by the card edge, like the Binance mark.
            styles.handFade: it only fades toward the bottom-right corner, so it stays clearly visible. */}
        {provider === "interac" ? (
          <span aria-hidden className={cn(styles.handFade, "pointer-events-none absolute -top-10 -right-6 h-64 w-44")}>
            <span className={cn(styles.interacMark, "block size-full")} />
          </span>
        ) : null}

        {/* Other only: a maple leaf outline in the bottom right, cropped by the card edge. */}
        {provider === "other" ? (
          <span aria-hidden className={cn(styles.leafFade, "pointer-events-none absolute -right-6 -bottom-14 size-44")}>
            <MapleLeafOutline className="size-full" />
          </span>
        ) : null}

        {/* styles.fade: logos and icons soften toward their left and right edges. */}
        <div className={cn(styles.fade, "absolute top-0 left-0")}>
          <ProviderLogo id={provider} />
        </div>

        <ContactlessIcon active={active} className={cn(styles.fade, "absolute top-0 right-0 size-6")} />

        <div className="absolute bottom-0 left-0 max-w-[60%] min-w-0">
          {/* Same size and style as the holder name below. */}
          <CreditCardName className="mb-0.5 truncate text-xs tracking-[0.12em] text-white/70">{methodName}</CreditCardName>
          <p className="truncate text-2xl font-bold tracking-tight text-white/90 tabular-nums">
            {amount} <span className="text-xs font-medium tracking-normal text-white/70">{currency}</span>
          </p>
          <CreditCardName className="mt-0.5 truncate text-xs tracking-[0.12em] text-white/70">{holder}</CreditCardName>
        </div>

        <div className="absolute right-0 bottom-0 flex items-center gap-2">
          {networks.map((network, index) => (
            <Fragment key={network}>
              {/* A thin line between the logos when a card has both networks. */}
              {index > 0 ? <span aria-hidden className="h-6 w-px bg-white/30" /> : null}
              <span className={cn(styles.fade, "flex")}>
                {network === "Mastercard" ? (
                  <MastercardMark />
                ) : (
                  // The package's icons have fixed colors, so a filter turns Visa into a white silhouette.
                  <PaymentIcon type={network} format="logo" className="h-auto w-12 opacity-80 brightness-0 invert" />
                )}
              </span>
            </Fragment>
          ))}
        </div>

        {/* Grain above everything, like printed card stock. -inset-5 undoes Kibo's 20px safe area. */}
        <span aria-hidden className={cn(styles.noise, "pointer-events-none absolute -inset-5")} />
      </CreditCardFront>
    </CreditCard>
  );
}
