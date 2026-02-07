import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { WalletProvider } from "../context/WalletContext";

export const metadata: Metadata = {
  title: "SLAPSure - Insurance Claims",
  description: "Automated insurance claims and payouts on Flare using FTSO",
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
          <Header />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
