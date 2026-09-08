import type { Metadata } from "next";
import { geistSans, geistMono } from "@/lib/fonts";
import { LiquidGlassFilter } from "@/components/ui/liquifyglasse";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Base",
  description: "Manage your clients and services with One Base.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LiquidGlassFilter />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
