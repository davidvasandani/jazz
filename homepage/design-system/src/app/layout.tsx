import type { Metadata } from 'next';
import './globals.css';

import { Manrope } from "next/font/google";
import { Inter } from "next/font/google";
import localFont from "next/font/local";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const pragmata = localFont({
  src: "../../fonts/ppr_0829.woff2",
  variable: "--font-ppr",
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={[
        manrope.variable,
        pragmata.variable,
        inter.className,
      ].join(" ")}>{children}</body>
    </html>
  );
}