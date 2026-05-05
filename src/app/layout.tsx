import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  variable: "--font-primary",
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "SB-GARAGE — Web Game Giải Đố Lắp Ráp Xe",
  description:
    "Lắp ráp linh kiện, chạy thử xe, chinh phục boss và trở thành huyền thoại gara!",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={vt323.variable} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
