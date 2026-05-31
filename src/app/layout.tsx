import type { Metadata, Viewport } from "next";
import { Caveat, Nunito } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { BRAND } from "@/lib/brand";
import { SHOP_NAME } from "@/lib/constants";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-brand",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-brand-hand",
});

export const metadata: Metadata = {
  title: `${SHOP_NAME} — Stock`,
  description: "Track donated, refurbished, and sold bikes at Bike Hub Mount Roskill",
  appleWebApp: {
    capable: true,
    title: "Bike Hub Stock",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: BRAND.blue,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${caveat.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
