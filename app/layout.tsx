import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LiquidGlassFilter } from "@/components/ui/liquifyglasse";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

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
      </body>
    </html>
  );
}
