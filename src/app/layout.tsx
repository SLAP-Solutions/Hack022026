import type { Metadata } from "next";
import { Merriweather, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "../components/layout/Header";
import { WalletProvider } from "../context/WalletContext";

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

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
    <html lang="en" className={`${manrope.variable} ${merriweather.variable}`}>
      <body className={`${manrope.className} min-h-screen bg-white dark:bg-black antialiased`}>
        <WalletProvider>
          <Header />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
