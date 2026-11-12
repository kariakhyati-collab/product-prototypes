import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Product prototypes · Khyati Karia",
    template: "%s · Product prototypes · Khyati Karia",
  },
  description:
    "Fast, clickable front-end prototypes for testing product ideas before building them: a chat ordering bot for an FMCG distributor and a field-sales app for retail reps.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-stone-900 dark:text-stone-100">{children}</body>
    </html>
  );
}
