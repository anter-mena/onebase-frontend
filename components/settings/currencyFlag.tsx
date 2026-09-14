import Image from "next/image";

// A country flag for a currency. SVGs from country-flag-icons (MIT) on jsDelivr:
// flag emojis do not render on Windows, which shows letters instead.
export function CurrencyFlag({ flag }: { flag: string }) {
  return (
    <Image
      src={`https://cdn.jsdelivr.net/npm/country-flag-icons@1.6.20/3x2/${flag}.svg`}
      alt=""
      width={20}
      height={14}
      unoptimized
      className="h-3 w-4 shrink-0 rounded-[2px] object-cover ring-1 ring-border"
    />
  );
}
