import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JazzAndAuth } from "@/components/JazzAndAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jazz Book Shelf",
  description: "Jazz Book Shelf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="mx-auto max-w-4xl px-4">
          <JazzAndAuth>{children}</JazzAndAuth>
        </main>
      </body>
    </html>
  );
}
