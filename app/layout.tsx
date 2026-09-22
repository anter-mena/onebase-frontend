import type { Metadata } from "next";
import { cookies } from "next/headers";
import { geistSans, geistMono } from "@/lib/fonts";
import { LiquidGlassFilter } from "@/components/ui/liquifyglasse";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  MODE_COOKIE,
  MODE_INIT_SCRIPT,
  THEME_COOKIE,
  parseMode,
  parseTheme,
} from "@/lib/theme/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Base",
  description: "Manage your clients and services with One Base.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Read here so the first HTML already carries both. Anything later — an
  // effect, a hook reading localStorage — repaints the entire page in front of
  // whoever is looking at it, and in dark mode that flash is a white screen.
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  const mode = parseMode(cookieStore.get(MODE_COOKIE)?.value);

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${
        mode === "dark" ? "dark" : ""
      }`}
      // On a first visit MODE_INIT_SCRIPT may add `dark` to this element before
      // React hydrates, so the class it finds will not be the class the server
      // sent. That difference is the point rather than a bug, and this is what
      // stops React reporting it. It suppresses one level only, so nothing
      // inside is affected.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* First thing in the body, and synchronous: it has to run before
            anything paints, or a person whose system is dark watches the page
            arrive white and then turn. Nothing else can do this — the server is
            never told `prefers-color-scheme`. */}
        <script dangerouslySetInnerHTML={{ __html: MODE_INIT_SCRIPT }} />
        <LiquidGlassFilter />
        <TooltipProvider delay={300}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
