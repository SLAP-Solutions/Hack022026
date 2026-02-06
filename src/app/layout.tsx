import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/layout/Header";

export const metadata: Metadata = {
  title: "Flare Insurance Claims",
  description: "Automated insurance payouts on Flare using FTSO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
