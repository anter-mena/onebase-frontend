"use client";

import { ErrorScreen } from "@/components/errors/errorScreen";
import { geistSans, geistMono } from "@/lib/fonts";
import "./globals.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Rebuild the document after a root-layout failure without relying on its router.
  const goHome = () => window.location.assign("/");

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head><title>Something went wrong | One Base</title></head>
      <body className="min-h-full">
        <ErrorScreen code={500} onRetry={retry} onHome={goHome} />
      </body>
    </html>
  );
}
