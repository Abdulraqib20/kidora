import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kidora",
    template: "%s · Kidora",
  },
  description:
    "Baby clothing, kids shoes, footwear and accessories. Quality picks, fair prices.",
};

/** Root HTML shell configuring fonts, global stylesheet, CartProvider, and toaster. */
export default function RootLayout({ children }: LayoutProps<"/">) {

  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <CartProvider>{children}</CartProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
