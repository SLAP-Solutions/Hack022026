import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { WalletProvider } from "../context/WalletContext";

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
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-black font-sans antialiased">
        <WalletProvider>
          <main className="container mx-auto px-4 py-8">
            <Header />
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
