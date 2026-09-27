import type { Metadata, Viewport } from "next";
import { assetUrl } from "@/lib/assets";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codigdex",
  description:
    "Pixel-art coding education game with a Pokédex-style collection mechanic.",
  icons: {
    icon: assetUrl("icons/codigdex-main-icon.png"),
    apple: assetUrl("icons/codigdex-main-icon.png"),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f1e4cb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
