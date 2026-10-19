import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DownloadManagerProvider } from "@/components/library/download-manager";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SwrProvider } from "@/components/swr-provider";
import { OfflineBanner } from "@/components/offline-banner";

const montserrat = localFont({
  src: "./fonts/montserrat-variable.ttf",
  variable: "--font-montserrat",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const metadata: Metadata = {
  title: "UsePagely — Your reading journey",
  description:
    "Log in to UsePagely and continue reading stories worth staying for.",
  generator: "anonydev",
  icons: {
    icon: [
      {
        url: "/icon-192.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-192.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/usepagely-icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "white",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased`}>
        <ThemeProvider>
          <SwrProvider>
            <OfflineBanner />
            <DownloadManagerProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </DownloadManagerProvider>
          </SwrProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
